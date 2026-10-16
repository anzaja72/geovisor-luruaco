package main

// Servidor de autorización OAuth 2.1 mínimo (code + PKCE S256, registro dinámico
// de clientes). El inicio de sesión se hace contra /api/auth/login del backend,
// es decir, contra la tabla `usuarios`; solo tecnico y administrador reciben código.

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"html/template"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

type clientClaim struct {
	K    string   `json:"k"`
	RU   []string `json:"ru"`
	Name string   `json:"n"`
}

type tokenClaim struct {
	K   string `json:"k"`
	UID int64  `json:"uid"`
	Em  string `json:"em"`
	Rol string `json:"rol"`
	BJ  string `json:"bj"` // JWT del backend
	Exp int64  `json:"exp"`
}

type codeEntry struct {
	clientID, redirect, challenge, jwt string
	user                               Usuario
	exp                                time.Time
}

type codeStore struct {
	mu sync.Mutex
	m  map[string]codeEntry
}

func (c *codeStore) put(e codeEntry) string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	code := hex.EncodeToString(b)
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.m == nil {
		c.m = map[string]codeEntry{}
	}
	now := time.Now()
	for k, v := range c.m {
		if now.After(v.exp) {
			delete(c.m, k)
		}
	}
	e.exp = now.Add(5 * time.Minute)
	c.m[code] = e
	return code
}

// take es de un solo uso: el código se borra al canjearlo.
func (c *codeStore) take(code string) (codeEntry, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.m[code]
	delete(c.m, code)
	if !ok || time.Now().After(e.exp) {
		return codeEntry{}, false
	}
	return e, true
}

func (s *Server) redirectPermitido(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" || u.Fragment != "" {
		return false
	}
	h := strings.ToLower(u.Hostname())
	local := h == "localhost" || h == "127.0.0.1"
	if u.Scheme != "https" && !(local && u.Scheme == "http") {
		return false
	}
	for _, ok := range s.cfg.RedirectHosts {
		if h == ok || strings.HasSuffix(h, "."+ok) {
			return true
		}
	}
	return false
}

func (s *Server) metadataRecurso(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"resource":                 s.cfg.PublicURL + "/mcp",
		"authorization_servers":    []string{s.cfg.PublicURL},
		"bearer_methods_supported": []string{"header"},
		"scopes_supported":         []string{"mcp"},
	})
}

func (s *Server) metadataAuth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"issuer":                                s.cfg.PublicURL,
		"authorization_endpoint":                s.cfg.PublicURL + "/authorize",
		"token_endpoint":                        s.cfg.PublicURL + "/token",
		"registration_endpoint":                 s.cfg.PublicURL + "/register",
		"response_types_supported":              []string{"code"},
		"grant_types_supported":                 []string{"authorization_code"},
		"code_challenge_methods_supported":      []string{"S256"},
		"token_endpoint_auth_methods_supported": []string{"none"},
		"scopes_supported":                      []string{"mcp"},
	})
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RedirectURIs []string `json:"redirect_uris"`
		ClientName   string   `json:"client_name"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&req) != nil || len(req.RedirectURIs) == 0 || len(req.RedirectURIs) > 10 {
		writeJSON(w, 400, map[string]string{"error": "invalid_client_metadata"})
		return
	}
	for _, u := range req.RedirectURIs {
		if !s.redirectPermitido(u) {
			writeJSON(w, 400, map[string]string{"error": "invalid_redirect_uri",
				"error_description": "redirect_uri no permitido"})
			return
		}
	}
	if len(req.ClientName) > 80 {
		req.ClientName = req.ClientName[:80]
	}
	id := firmar(s.cfg.TokenSecret, clientClaim{K: "client", RU: req.RedirectURIs, Name: req.ClientName})
	writeJSON(w, 201, map[string]any{
		"client_id":                  id,
		"client_name":                req.ClientName,
		"redirect_uris":              req.RedirectURIs,
		"grant_types":                []string{"authorization_code"},
		"response_types":             []string{"code"},
		"token_endpoint_auth_method": "none",
	})
}

var loginTpl = template.Must(template.New("l").Parse(`<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Geovisor Luruaco · MCP</title>
<style>body{font-family:system-ui,sans-serif;background:#f3f6f4;display:grid;place-items:center;min-height:100vh;margin:0}
form{background:#fff;padding:2rem;border-radius:12px;max-width:380px;width:calc(100% - 2rem);box-shadow:0 2px 12px #0002}
h1{font-size:1.15rem;margin:0 0 .25rem;color:#1b4d3e}p{color:#444;font-size:.9rem}
label{display:block;margin:.8rem 0 .2rem;font-size:.85rem}input{width:100%;box-sizing:border-box;padding:.6rem;border:1px solid #bbb;border-radius:6px}
button{margin-top:1.2rem;width:100%;padding:.7rem;border:0;border-radius:6px;background:#1b4d3e;color:#fff;font-size:1rem;cursor:pointer}
.err{color:#b00020;font-size:.9rem}</style>
<form method="post" action="/authorize">
<h1>Geodatabase Luruaco</h1>
<p>{{.Cliente}} solicita acceso de <b>solo lectura</b>. Disponible para técnicos y administradores.</p>
{{if .Error}}<p class="err">{{.Error}}</p>{{end}}
{{range $k,$v := .Hidden}}<input type="hidden" name="{{$k}}" value="{{$v}}">{{end}}
<label>Correo<input name="email" type="email" required autocomplete="username"></label>
<label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label>
<button>Autorizar</button></form></html>`))

type authParams struct {
	ClientID, Redirect, Challenge, State string
}

func (s *Server) validarAuthParams(q func(string) string) (authParams, string, bool) {
	p := authParams{q("client_id"), q("redirect_uri"), q("code_challenge"), q("state")}
	var c clientClaim
	if verificar(s.cfg.TokenSecret, p.ClientID, &c) != nil || c.K != "client" {
		return p, "", false
	}
	ok := false
	for _, ru := range c.RU {
		if ru == p.Redirect {
			ok = true
		}
	}
	if !ok || q("response_type") != "code" || q("code_challenge_method") != "S256" || len(p.Challenge) < 43 {
		return p, "", false
	}
	name := c.Name
	if name == "" {
		name = "Una aplicación"
	}
	return p, name, true
}

func (s *Server) authorize(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		_ = r.ParseForm()
	}
	get := func(k string) string {
		if r.Method == http.MethodPost {
			return r.PostForm.Get(k)
		}
		return r.URL.Query().Get(k)
	}
	p, nombre, ok := s.validarAuthParams(get)
	if !ok {
		// Con client_id/redirect_uri inválidos no se redirige jamás (RFC 6749 §4.1.2.1).
		http.Error(w, "Solicitud de autorización inválida (cliente, redirect_uri o PKCE S256).", 400)
		return
	}
	hidden := map[string]string{
		"client_id": p.ClientID, "redirect_uri": p.Redirect, "code_challenge": p.Challenge,
		"code_challenge_method": "S256", "response_type": "code", "state": p.State,
	}
	render := func(code int, msg string) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Frame-Options", "DENY")
		w.WriteHeader(code)
		_ = loginTpl.Execute(w, map[string]any{"Cliente": nombre, "Hidden": hidden, "Error": msg})
	}
	if r.Method != http.MethodPost {
		render(200, "")
		return
	}
	ip := s.clientIP(r)
	if ok, _ := s.loginLim.Allow(ip); !ok {
		s.audit.Log(AuditEvent{Evento: "limite", IP: ip, Estado: "429", Detalle: "authorize"})
		render(429, "Demasiados intentos. Espere un minuto.")
		return
	}
	jwt, u, err := s.backend.Login(r.Context(), get("email"), get("password"))
	if err != nil {
		s.audit.Log(AuditEvent{Evento: "login", Email: get("email"), IP: ip, Estado: "401"})
		render(401, "Credenciales inválidas.")
		return
	}
	if !rolesPermitidos[u.Rol] {
		s.audit.Log(AuditEvent{Evento: "denegado", UsuarioID: u.ID, Email: u.Email, Rol: u.Rol, IP: ip,
			Estado: "403", Detalle: "rol sin acceso al MCP"})
		render(403, "Su rol no tiene acceso al servidor MCP (solo técnico y administrador).")
		return
	}
	code := s.codes.put(codeEntry{clientID: p.ClientID, redirect: p.Redirect, challenge: p.Challenge, jwt: jwt, user: *u})
	s.audit.Log(AuditEvent{Evento: "login", UsuarioID: u.ID, Email: u.Email, Rol: u.Rol, IP: ip, Estado: "200"})
	loc, _ := url.Parse(p.Redirect)
	qs := loc.Query()
	qs.Set("code", code)
	if p.State != "" {
		qs.Set("state", p.State)
	}
	loc.RawQuery = qs.Encode()
	http.Redirect(w, r, loc.String(), http.StatusFound)
}

func (s *Server) token(w http.ResponseWriter, r *http.Request) {
	if r.ParseForm() != nil || r.PostForm.Get("grant_type") != "authorization_code" {
		writeJSON(w, 400, map[string]string{"error": "unsupported_grant_type"})
		return
	}
	e, ok := s.codes.take(r.PostForm.Get("code"))
	if !ok || e.clientID != r.PostForm.Get("client_id") || e.redirect != r.PostForm.Get("redirect_uri") {
		writeJSON(w, 400, map[string]string{"error": "invalid_grant"})
		return
	}
	sum := sha256.Sum256([]byte(r.PostForm.Get("code_verifier")))
	got := base64.RawURLEncoding.EncodeToString(sum[:])
	if subtle.ConstantTimeCompare([]byte(got), []byte(e.challenge)) != 1 {
		writeJSON(w, 400, map[string]string{"error": "invalid_grant", "error_description": "PKCE"})
		return
	}
	exp := time.Now().Add(s.cfg.TokenTTL)
	at := firmar(s.cfg.TokenSecret, tokenClaim{K: "at", UID: e.user.ID, Em: e.user.Email, Rol: e.user.Rol,
		BJ: e.jwt, Exp: exp.Unix()})
	writeJSON(w, 200, map[string]any{
		"access_token": at, "token_type": "Bearer",
		"expires_in": int(s.cfg.TokenTTL.Seconds()), "scope": "mcp",
	})
}
