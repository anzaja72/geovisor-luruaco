package main

// Servidor MCP (Streamable HTTP, sin estado) para la geodatabase del geovisor
// Luruaco. Solo lectura, solo roles tecnico y administrador, y siempre a través
// de la API REST del backend: no toca PostGIS.

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type Server struct {
	cfg      Config
	backend  *Backend
	audit    *Auditor
	limiter  *Limiter // por usuario, sobre /mcp
	loginLim *Limiter // por IP, sobre /authorize y peticiones sin autenticar
	codes    codeStore
	tools    []Tool
	byName   map[string]Tool
}

func NewServer(cfg Config) *Server {
	s := &Server{
		cfg:      cfg,
		backend:  &Backend{base: cfg.BackendURL, http: &http.Client{Timeout: cfg.BackendTimeout}},
		audit:    NewAuditor(cfg.AuditFile),
		limiter:  NewLimiter(cfg.RatePerMin),
		loginLim: NewLimiter(10),
		tools:    buildTools(),
		byName:   map[string]Tool{},
	}
	for _, t := range s.tools {
		s.byName[t.Name] = t
	}
	return s
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /.well-known/oauth-protected-resource", s.metadataRecurso)
	mux.HandleFunc("GET /.well-known/oauth-protected-resource/mcp", s.metadataRecurso)
	mux.HandleFunc("GET /.well-known/oauth-authorization-server", s.metadataAuth)
	mux.HandleFunc("POST /register", s.register)
	mux.HandleFunc("GET /authorize", s.authorize)
	mux.HandleFunc("POST /authorize", s.authorize)
	mux.HandleFunc("POST /token", s.token)
	mux.HandleFunc("POST /mcp", s.mcp)
	mux.HandleFunc("GET /mcp", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Allow", "POST")
		http.Error(w, "Este servidor no ofrece flujo SSE; use POST.", http.StatusMethodNotAllowed)
	})
	return securityHeaders(mux)
}

func securityHeaders(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		h.ServeHTTP(w, r)
	})
}

// ---------- JSON-RPC ----------

type rpcReq struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type rpcErr struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type rpcResp struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  any             `json:"result,omitempty"`
	Error   *rpcErr         `json:"error,omitempty"`
}

var versionesMCP = []string{"2025-06-18", "2025-03-26", "2024-11-05"}

func (s *Server) challenge(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("WWW-Authenticate",
		`Bearer resource_metadata="`+s.cfg.PublicURL+`/.well-known/oauth-protected-resource"`)
	writeJSON(w, code, map[string]string{"error": msg})
}

// autenticar acepta un access token del MCP (OAuth) o, como alternativa, el JWT
// del backend obtenido con /api/auth/login. En ambos casos la cuenta y el rol se
// reconfirman contra el backend en CADA petición.
func (s *Server) autenticar(ctx context.Context, r *http.Request) (*Usuario, string, int, string) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return nil, "", 401, "Token requerido"
	}
	tok := strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
	jwt := tok
	if strings.Count(tok, ".") == 1 {
		var c tokenClaim
		if verificar(s.cfg.TokenSecret, tok, &c) != nil || c.K != "at" || time.Now().Unix() > c.Exp {
			return nil, "", 401, "Token inválido o expirado"
		}
		jwt = c.BJ
	}
	u, err := s.backend.Me(ctx, jwt)
	if err != nil {
		var eb *ErrBackend
		if errors.As(err, &eb) && (eb.Status == 401 || eb.Status == 403) {
			return nil, "", 401, "Token inválido, expirado o cuenta desactivada"
		}
		return nil, "", 502, "Backend no disponible"
	}
	return u, jwt, 0, ""
}

func (s *Server) mcp(w http.ResponseWriter, r *http.Request) {
	ip := s.clientIP(r)
	if o := r.Header.Get("Origin"); o != "" && !s.origenPermitido(o) {
		s.audit.Log(AuditEvent{Evento: "denegado", IP: ip, Estado: "403", Detalle: "origin " + o})
		writeJSON(w, 403, map[string]string{"error": "Origin no permitido"})
		return
	}
	// Antes de autenticar, un tope por IP evita que se use el endpoint para
	// martillar el backend con tokens inválidos.
	if ok, wait := s.loginLim.Allow("mcp|" + ip); !ok {
		w.Header().Set("Retry-After", itoa(wait))
		writeJSON(w, 429, map[string]string{"error": "Demasiadas peticiones"})
		return
	}
	u, jwt, code, msg := s.autenticar(r.Context(), r)
	if u == nil {
		s.audit.Log(AuditEvent{Evento: "auth", IP: ip, Estado: itoa(code), Detalle: msg})
		if code == 401 {
			s.challenge(w, 401, msg)
		} else {
			writeJSON(w, code, map[string]string{"error": msg})
		}
		return
	}
	if !rolesPermitidos[u.Rol] {
		s.audit.Log(AuditEvent{Evento: "denegado", UsuarioID: u.ID, Email: u.Email, Rol: u.Rol, IP: ip,
			Estado: "403", Detalle: "rol sin acceso al MCP"})
		writeJSON(w, 403, map[string]string{"error": "El rol '" + u.Rol + "' no tiene acceso al servidor MCP"})
		return
	}
	if ok, wait := s.limiter.Allow(itoa(u.ID)); !ok {
		s.audit.Log(AuditEvent{Evento: "limite", UsuarioID: u.ID, Email: u.Email, Rol: u.Rol, IP: ip, Estado: "429"})
		w.Header().Set("Retry-After", itoa(wait))
		writeJSON(w, 429, map[string]string{"error": "Límite de peticiones excedido"})
		return
	}

	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 256<<10))
	if err != nil {
		writeJSON(w, 413, map[string]string{"error": "Cuerpo demasiado grande"})
		return
	}
	trim := strings.TrimSpace(string(body))
	var reqs []rpcReq
	batch := strings.HasPrefix(trim, "[")
	if batch {
		err = json.Unmarshal(body, &reqs)
	} else {
		var one rpcReq
		err = json.Unmarshal(body, &one)
		reqs = []rpcReq{one}
	}
	if err != nil || len(reqs) == 0 || len(reqs) > 20 {
		writeJSON(w, 400, rpcResp{JSONRPC: "2.0", ID: json.RawMessage("null"),
			Error: &rpcErr{-32700, "JSON-RPC inválido"}})
		return
	}
	resps := []rpcResp{}
	for _, q := range reqs {
		if rs := s.dispatch(r.Context(), u, jwt, ip, q); rs != nil {
			resps = append(resps, *rs)
		}
	}
	if len(resps) == 0 { // solo notificaciones
		w.WriteHeader(http.StatusAccepted)
		return
	}
	if batch {
		writeJSON(w, 200, resps)
	} else {
		writeJSON(w, 200, resps[0])
	}
}

func (s *Server) origenPermitido(o string) bool {
	if strings.EqualFold(strings.TrimRight(o, "/"), s.cfg.PublicURL) {
		return true
	}
	return s.redirectPermitido(o)
}

func (s *Server) dispatch(ctx context.Context, u *Usuario, jwt, ip string, q rpcReq) *rpcResp {
	isNotif := len(q.ID) == 0
	ok := func(res any) *rpcResp {
		if isNotif {
			return nil
		}
		return &rpcResp{JSONRPC: "2.0", ID: q.ID, Result: res}
	}
	fail := func(code int, m string) *rpcResp {
		if isNotif {
			return nil
		}
		return &rpcResp{JSONRPC: "2.0", ID: q.ID, Error: &rpcErr{code, m}}
	}
	switch q.Method {
	case "initialize":
		var p struct {
			ProtocolVersion string `json:"protocolVersion"`
		}
		_ = json.Unmarshal(q.Params, &p)
		ver := versionesMCP[0]
		for _, v := range versionesMCP {
			if v == p.ProtocolVersion {
				ver = v
			}
		}
		return ok(map[string]any{
			"protocolVersion": ver,
			"capabilities":    map[string]any{"tools": map[string]any{"listChanged": false}},
			"serverInfo":      map[string]string{"name": "luruaco-geodatabase", "version": "1.0.0"},
			"instructions": "Geodatabase de restauración ecológica de la Ciénaga de Luruaco (C.R.A.). " +
				"Solo lectura. Los datos de campo pueden incluir registros de demostración (es_demostracion).",
		})
	case "ping":
		return ok(map[string]any{})
	case "tools/list":
		defs := make([]map[string]any, 0, len(s.tools))
		for _, t := range s.tools {
			defs = append(defs, t.def())
		}
		s.audit.Log(AuditEvent{Evento: "tool", UsuarioID: u.ID, Email: u.Email, Rol: u.Rol, IP: ip,
			Metodo: "tools/list", Estado: "200"})
		return ok(map[string]any{"tools": defs})
	case "tools/call":
		var p struct {
			Name string         `json:"name"`
			Args map[string]any `json:"arguments"`
		}
		if json.Unmarshal(q.Params, &p) != nil {
			return fail(-32602, "Parámetros inválidos")
		}
		t, found := s.byName[p.Name]
		if !found {
			return fail(-32602, "Herramienta desconocida: "+p.Name)
		}
		if p.Args == nil {
			p.Args = map[string]any{}
		}
		ev := AuditEvent{Evento: "tool", UsuarioID: u.ID, Email: u.Email, Rol: u.Rol, IP: ip,
			Metodo: "tools/call", Tool: p.Name, Args: auditArgs(p.Args)}
		ini := time.Now()
		tctx, cancel := context.WithTimeout(ctx, s.cfg.BackendTimeout)
		defer cancel()
		res, err := t.Run(tctx, s, jwt, p.Args)
		ev.MS = time.Since(ini).Milliseconds()
		if err != nil {
			ev.Estado = "error"
			ev.Detalle = err.Error()
			s.audit.Log(ev)
			var eb *ErrBackend
			msg := err.Error()
			if errors.As(err, &eb) {
				msg = "El backend respondió " + itoa(eb.Status) + ": " + eb.Msg
			}
			return ok(map[string]any{"isError": true,
				"content": []map[string]string{{"type": "text", "text": msg}}})
		}
		if arr, isArr := res.([]any); isArr {
			res = map[string]any{"resultados": arr}
		}
		txt, trunc := truncar(res, s.cfg.MaxResponse)
		ev.Estado, ev.Bytes, ev.Truncado = "ok", len(txt), trunc
		s.audit.Log(ev)
		return ok(map[string]any{"content": []map[string]string{{"type": "text", "text": txt}}})
	default:
		if strings.HasPrefix(q.Method, "notifications/") {
			return nil
		}
		return fail(-32601, "Método no soportado: "+q.Method)
	}
}

// auditArgs registra los argumentos recortados: queda constancia de qué se pidió
// sin volcar textos largos.
func auditArgs(a map[string]any) map[string]any {
	out := map[string]any{}
	for k, v := range a {
		if s, ok := v.(string); ok && len([]rune(s)) > 200 {
			v = string([]rune(s)[:200]) + "…"
		}
		out[k] = v
	}
	return out
}

func itoa[T ~int | ~int64](n T) string { return formatInt(int64(n)) }

func main() {
	cfg := loadConfig()
	s := NewServer(cfg)
	srv := &http.Server{
		Addr: cfg.Addr, Handler: s.Handler(),
		ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 30 * time.Second,
		WriteTimeout: 60 * time.Second, IdleTimeout: 60 * time.Second,
	}
	log.Printf("MCP Luruaco escuchando en %s (público: %s, backend: %s)", cfg.Addr, cfg.PublicURL, cfg.BackendURL)
	log.Fatal(srv.ListenAndServe())
}
