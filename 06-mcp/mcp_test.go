package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
)

// Backend simulado: reproduce el contrato del backend real (login, /auth/me con
// rol releído, capas sensibles solo para tecnico/administrador).
type fakeBackend struct {
	mu       sync.Mutex
	users    map[string]Usuario // por email
	pass     map[string]string
	inactive map[string]bool
	seenAuth []string // Authorization recibido en /api/capas/geojson
}

func jwtDe(email string) string {
	return "a.b." + strings.NewReplacer(".", "_", "@", "-").Replace(email)
}

func newFake() *fakeBackend {
	return &fakeBackend{
		users: map[string]Usuario{
			"admin@x.co": {1, "Admin", "admin@x.co", "administrador"},
			"tec@x.co":   {2, "Tec", "tec@x.co", "tecnico"},
			"con@x.co":   {3, "Con", "con@x.co", "consulta"},
		},
		pass:     map[string]string{"admin@x.co": "pw-admin", "tec@x.co": "pw-tec", "con@x.co": "pw-con"},
		inactive: map[string]bool{},
	}
}

func (f *fakeBackend) byJWT(h string) (Usuario, bool) {
	// Los JWT reales tienen la forma a.b.c: aquí "a.b.<email con _ por . y @>".
	t := strings.TrimPrefix(h, "Bearer ")
	if !strings.HasPrefix(t, "a.b.") {
		return Usuario{}, false
	}
	for email, u := range f.users {
		if jwtDe(email) == t && !f.inactive[email] {
			return u, true
		}
	}
	return Usuario{}, false
}

func (f *fakeBackend) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()
	switch r.URL.Path {
	case "/api/auth/login":
		var b struct{ Email, Password string }
		_ = json.NewDecoder(r.Body).Decode(&b)
		u, ok := f.users[b.Email]
		if !ok || f.pass[b.Email] != b.Password || f.inactive[b.Email] {
			writeJSON(w, 401, map[string]string{"error": "Credenciales inválidas"})
			return
		}
		writeJSON(w, 200, map[string]any{"token": jwtDe(u.Email), "usuario": u})
		return
	}
	u, ok := f.byJWT(r.Header.Get("Authorization"))
	if !ok {
		writeJSON(w, 401, map[string]string{"error": "Token inválido"})
		return
	}
	switch r.URL.Path {
	case "/api/auth/me":
		writeJSON(w, 200, u)
	case "/api/capas/geojson":
		f.seenAuth = append(f.seenAuth, r.Header.Get("Authorization"))
		feats := []any{map[string]any{"type": "Feature", "properties": map[string]any{"capa": "publica"}}}
		if u.Rol == "tecnico" || u.Rol == "administrador" {
			feats = append(feats, map[string]any{"type": "Feature",
				"properties": map[string]any{"capa": "camaras_trampa", "sensible": true}})
		}
		writeJSON(w, 200, map[string]any{"type": "FeatureCollection", "features": feats})
	case "/api/puntos":
		many := []any{}
		for i := 0; i < 3000; i++ {
			many = append(many, map[string]any{"properties": map[string]any{
				"codigo_punto": fmt.Sprintf("P%04d", i), "tipo_monitoreo": "parcela", "x": strings.Repeat("a", 80)}})
		}
		writeJSON(w, 200, map[string]any{"type": "FeatureCollection", "features": many})
	case "/api/fauna/observaciones":
		writeJSON(w, 200, []any{
			map[string]any{"grupo": "Aves", "nombre_comun": "Garza"},
			map[string]any{"grupo": "Reptiles", "nombre_comun": "Iguana"}})
	default:
		writeJSON(w, 404, map[string]string{"error": "no"})
	}
}

type harness struct {
	t    *testing.T
	fake *fakeBackend
	srv  *Server
	ts   *httptest.Server
}

func setup(t *testing.T, mut func(*Config)) *harness {
	fake := newFake()
	be := httptest.NewServer(fake)
	t.Cleanup(be.Close)
	cfg := Config{
		BackendURL: be.URL, PublicURL: "https://mcp.test", TokenSecret: []byte(strings.Repeat("s", 40)),
		RatePerMin: 100, MaxResponse: 200000, TokenTTL: 3600e9, BackendTimeout: 5e9,
		RedirectHosts: []string{"claude.ai", "chatgpt.com", "localhost"},
	}
	if mut != nil {
		mut(&cfg)
	}
	s := NewServer(cfg)
	ts := httptest.NewServer(s.Handler())
	t.Cleanup(ts.Close)
	return &harness{t, fake, s, ts}
}

func (e *harness) rpc(token, method string, params any) (int, map[string]any) {
	body, _ := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	req, _ := http.NewRequest("POST", e.ts.URL+"/mcp", strings.NewReader(string(body)))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		e.t.Fatal(err)
	}
	defer res.Body.Close()
	var out map[string]any
	b, _ := io.ReadAll(res.Body)
	_ = json.Unmarshal(b, &out)
	return res.StatusCode, out
}

func toolText(t *testing.T, out map[string]any) string {
	t.Helper()
	res, _ := out["result"].(map[string]any)
	c, _ := res["content"].([]any)
	if len(c) == 0 {
		t.Fatalf("sin contenido: %v", out)
	}
	return c[0].(map[string]any)["text"].(string)
}

// Flujo OAuth completo; devuelve el access token o el estado HTTP del /authorize.
func (e *harness) oauth(email, pass string) (string, int) {
	noFollow := &http.Client{CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	reg, _ := http.Post(e.ts.URL+"/register", "application/json",
		strings.NewReader(`{"redirect_uris":["https://claude.ai/api/mcp/auth_callback"],"client_name":"Claude"}`))
	var rc map[string]any
	_ = json.NewDecoder(reg.Body).Decode(&rc)
	cid, _ := rc["client_id"].(string)
	verifier := strings.Repeat("v", 50)
	sum := sha256.Sum256([]byte(verifier))
	ch := base64.RawURLEncoding.EncodeToString(sum[:])
	form := url.Values{"client_id": {cid}, "redirect_uri": {"https://claude.ai/api/mcp/auth_callback"},
		"code_challenge": {ch}, "code_challenge_method": {"S256"}, "response_type": {"code"},
		"state": {"xyz"}, "email": {email}, "password": {pass}}
	res, err := noFollow.PostForm(e.ts.URL+"/authorize", form)
	if err != nil {
		e.t.Fatal(err)
	}
	if res.StatusCode != 302 {
		return "", res.StatusCode
	}
	loc, _ := url.Parse(res.Header.Get("Location"))
	if loc.Query().Get("state") != "xyz" {
		e.t.Fatal("state no devuelto")
	}
	code := loc.Query().Get("code")
	tok := func(ver string) (int, map[string]any) {
		r, _ := http.PostForm(e.ts.URL+"/token", url.Values{"grant_type": {"authorization_code"},
			"code": {code}, "code_verifier": {ver}, "client_id": {cid},
			"redirect_uri": {"https://claude.ai/api/mcp/auth_callback"}})
		var o map[string]any
		_ = json.NewDecoder(r.Body).Decode(&o)
		return r.StatusCode, o
	}
	if st, _ := tok("mal-verifier"); st != 400 { // PKCE incorrecto
		e.t.Fatalf("PKCE incorrecto aceptado: %d", st)
	}
	if st, _ := tok(verifier); st != 400 { // el código ya se consumió en el intento anterior
		e.t.Fatalf("código reutilizable: %d", st)
	}
	// Segundo ciclo limpio para obtener token válido.
	res, _ = noFollow.PostForm(e.ts.URL+"/authorize", form)
	loc, _ = url.Parse(res.Header.Get("Location"))
	code = loc.Query().Get("code")
	st, o := tok(verifier)
	if st != 200 {
		e.t.Fatalf("token: %d %v", st, o)
	}
	return o["access_token"].(string), 302
}

func TestSinTokenDa401ConMetadata(t *testing.T) {
	e := setup(t, nil)
	st, _ := e.rpc("", "tools/list", nil)
	if st != 401 {
		t.Fatalf("esperaba 401, got %d", st)
	}
	res, _ := http.Get(e.ts.URL + "/.well-known/oauth-authorization-server")
	if res.StatusCode != 200 {
		t.Fatal("metadata AS")
	}
}

func TestConsultaRecibe403(t *testing.T) {
	e := setup(t, nil)
	// 1) Con el JWT directo del backend.
	st, _ := e.rpc(jwtDe("con@x.co"), "tools/list", nil)
	if st != 403 {
		t.Fatalf("consulta con JWT: esperaba 403, got %d", st)
	}
	// 2) En el flujo OAuth ni siquiera se emite código.
	if tok, st := e.oauth("con@x.co", "pw-con"); st != 403 || tok != "" {
		t.Fatalf("consulta en OAuth: esperaba 403, got %d", st)
	}
	// Y el backend jamás recibió una consulta de datos.
	if len(e.fake.seenAuth) != 0 {
		t.Fatal("el backend recibió peticiones de datos de consulta")
	}
}

func TestTecnicoYAdminAccedenYVenSensibles(t *testing.T) {
	e := setup(t, nil)
	for _, c := range []struct{ email, pass string }{{"tec@x.co", "pw-tec"}, {"admin@x.co", "pw-admin"}} {
		tok, st := e.oauth(c.email, c.pass)
		if st != 302 || tok == "" {
			t.Fatalf("%s: login OAuth %d", c.email, st)
		}
		code, out := e.rpc(tok, "tools/call", map[string]any{"name": "capa_geojson", "arguments": map[string]any{"capa": "x"}})
		if code != 200 {
			t.Fatalf("%s: %d", c.email, code)
		}
		if !strings.Contains(toolText(t, out), "camaras_trampa") {
			t.Fatalf("%s no recibió la capa sensible", c.email)
		}
	}
	// El backend recibió el JWT propio de cada usuario (el filtrado ocurre allí).
	got := strings.Join(e.fake.seenAuth, ",")
	if !strings.Contains(got, jwtDe("tec@x.co")) || !strings.Contains(got, jwtDe("admin@x.co")) {
		t.Fatalf("JWT reenviados: %s", got)
	}
}

func TestListaDeHerramientasSoloLectura(t *testing.T) {
	e := setup(t, nil)
	_, out := e.rpc(jwtDe("tec@x.co"), "tools/list", nil)
	tools := out["result"].(map[string]any)["tools"].([]any)
	if len(tools) < 10 {
		t.Fatalf("pocas herramientas: %d", len(tools))
	}
	for _, x := range tools {
		a := x.(map[string]any)["annotations"].(map[string]any)
		if a["readOnlyHint"] != true || a["destructiveHint"] != false {
			t.Fatalf("%v no es de solo lectura", x.(map[string]any)["name"])
		}
	}
}

func TestCuentaDesactivadaSeRechazaEnLaSiguientePeticion(t *testing.T) {
	e := setup(t, nil)
	tok, _ := e.oauth("tec@x.co", "pw-tec")
	if st, _ := e.rpc(tok, "ping", nil); st != 200 {
		t.Fatal("ping")
	}
	e.fake.mu.Lock()
	e.fake.inactive["tec@x.co"] = true
	e.fake.mu.Unlock()
	if st, _ := e.rpc(tok, "ping", nil); st != 401 {
		t.Fatalf("cuenta desactivada: esperaba 401, got %d", st)
	}
}

func TestDegradacionDeRolSeRechaza(t *testing.T) {
	e := setup(t, nil)
	tok, _ := e.oauth("tec@x.co", "pw-tec")
	e.fake.mu.Lock()
	u := e.fake.users["tec@x.co"]
	u.Rol = "consulta"
	e.fake.users["tec@x.co"] = u
	e.fake.mu.Unlock()
	if st, _ := e.rpc(tok, "ping", nil); st != 403 {
		t.Fatalf("rol degradado: esperaba 403, got %d", st)
	}
}

func TestLimiteDePeticiones(t *testing.T) {
	e := setup(t, func(c *Config) { c.RatePerMin = 3 })
	for i := 0; i < 3; i++ {
		if st, _ := e.rpc(jwtDe("tec@x.co"), "ping", nil); st != 200 {
			t.Fatalf("petición %d: %d", i, st)
		}
	}
	if st, _ := e.rpc(jwtDe("tec@x.co"), "ping", nil); st != 429 {
		t.Fatalf("esperaba 429, got %d", st)
	}
}

func TestTopeDeTamanoYFiltros(t *testing.T) {
	e := setup(t, func(c *Config) { c.MaxResponse = 5000 })
	_, out := e.rpc(jwtDe("tec@x.co"), "tools/call", map[string]any{"name": "listar_parcelas",
		"arguments": map[string]any{"limite": 1000}})
	txt := toolText(t, out)
	if len(txt) > 5000 {
		t.Fatalf("respuesta de %d bytes supera el tope", len(txt))
	}
	if !strings.Contains(txt, "truncado") {
		t.Fatal("falta aviso de truncado")
	}
	_, out = e.rpc(jwtDe("tec@x.co"), "tools/call", map[string]any{"name": "fauna_observaciones",
		"arguments": map[string]any{"grupo": "aves"}})
	txt = toolText(t, out)
	if !strings.Contains(txt, "Garza") || strings.Contains(txt, "Iguana") {
		t.Fatalf("filtro por grupo: %s", txt)
	}
}

func TestRegistroRechazaRedirectNoPermitido(t *testing.T) {
	e := setup(t, nil)
	res, _ := http.Post(e.ts.URL+"/register", "application/json",
		strings.NewReader(`{"redirect_uris":["https://evil.example/cb"]}`))
	if res.StatusCode != 400 {
		t.Fatalf("esperaba 400, got %d", res.StatusCode)
	}
}

func TestOrigenNoPermitido(t *testing.T) {
	e := setup(t, nil)
	req, _ := http.NewRequest("POST", e.ts.URL+"/mcp", strings.NewReader(`{}`))
	req.Header.Set("Origin", "https://evil.example")
	req.Header.Set("Authorization", "Bearer "+jwtDe("tec@x.co"))
	res, _ := http.DefaultClient.Do(req)
	if res.StatusCode != 403 {
		t.Fatalf("esperaba 403, got %d", res.StatusCode)
	}
}
