package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ---------- Tokens firmados (HMAC-SHA256) ----------
// Sin estado en servidor: client_id y access_token son blobs firmados.

func firmar(secret []byte, v any) string {
	p, _ := json.Marshal(v)
	b := base64.RawURLEncoding.EncodeToString(p)
	m := hmac.New(sha256.New, secret)
	m.Write([]byte(b))
	return b + "." + base64.RawURLEncoding.EncodeToString(m.Sum(nil))
}

func verificar(secret []byte, tok string, out any) error {
	i := strings.IndexByte(tok, '.')
	if i < 0 || strings.Count(tok, ".") != 1 {
		return errors.New("formato")
	}
	m := hmac.New(sha256.New, secret)
	m.Write([]byte(tok[:i]))
	want := base64.RawURLEncoding.EncodeToString(m.Sum(nil))
	if !hmac.Equal([]byte(want), []byte(tok[i+1:])) {
		return errors.New("firma")
	}
	p, err := base64.RawURLEncoding.DecodeString(tok[:i])
	if err != nil {
		return err
	}
	return json.Unmarshal(p, out)
}

// ---------- Límite de peticiones (ventana deslizante de 1 minuto) ----------

type Limiter struct {
	mu   sync.Mutex
	max  int
	hits map[string][]time.Time
}

func NewLimiter(max int) *Limiter { return &Limiter{max: max, hits: map[string][]time.Time{}} }

// Allow devuelve false y los segundos de espera si se excedió el cupo.
func (l *Limiter) Allow(key string) (bool, int) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	corte := now.Add(-time.Minute)
	h := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if t.After(corte) {
			h = append(h, t)
		}
	}
	if len(h) >= l.max {
		l.hits[key] = h
		return false, int(h[0].Add(time.Minute).Sub(now).Seconds()) + 1
	}
	l.hits[key] = append(h, now)
	return true, 0
}

// ---------- Auditoría: quién consultó qué ----------

type Auditor struct {
	mu sync.Mutex
	w  []*json.Encoder
}

func NewAuditor(file string) *Auditor {
	a := &Auditor{w: []*json.Encoder{json.NewEncoder(os.Stdout)}}
	if file != "" {
		f, err := os.OpenFile(file, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o640)
		if err != nil {
			log.Printf("auditoría: no se pudo abrir %s: %v", file, err)
		} else {
			a.w = append(a.w, json.NewEncoder(f))
		}
	}
	return a
}

type AuditEvent struct {
	TS        string `json:"ts"`
	Evento    string `json:"evento"` // login | tool | denegado | limite | auth
	UsuarioID int64  `json:"usuario_id,omitempty"`
	Email     string `json:"email,omitempty"`
	Rol       string `json:"rol,omitempty"`
	IP        string `json:"ip,omitempty"`
	Metodo    string `json:"metodo,omitempty"`
	Tool      string `json:"tool,omitempty"`
	Args      any    `json:"args,omitempty"`
	Estado    string `json:"estado"`
	Bytes     int    `json:"bytes,omitempty"`
	Truncado  bool   `json:"truncado,omitempty"`
	MS        int64  `json:"ms,omitempty"`
	Detalle   string `json:"detalle,omitempty"`
}

func (a *Auditor) Log(e AuditEvent) {
	e.TS = time.Now().UTC().Format(time.RFC3339)
	a.mu.Lock()
	defer a.mu.Unlock()
	for _, w := range a.w {
		_ = w.Encode(e)
	}
}

// ---------- Utilidades HTTP ----------

func (s *Server) clientIP(r *http.Request) string {
	if s.cfg.TrustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			// Traefik añade la IP real al final; lo anterior lo controla el cliente.
			return strings.TrimSpace(parts[len(parts)-1])
		}
	}
	h, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return h
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func formatInt(n int64) string { return strconv.FormatInt(n, 10) }
