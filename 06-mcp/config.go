package main

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

// Roles autorizados para usar el MCP. El rol `consulta` queda fuera a propósito:
// este servidor es una herramienta de administración, no un visor público.
var rolesPermitidos = map[string]bool{"tecnico": true, "administrador": true}

type Config struct {
	BackendURL     string        // API REST del backend Go, p. ej. http://backend:8080
	PublicURL      string        // URL pública del MCP, p. ej. https://mcp.luruacorenace.online
	TokenSecret    []byte        // firma de client_id y access tokens
	Addr           string        // dirección de escucha
	RatePerMin     int           // peticiones por usuario y minuto
	MaxResponse    int           // tope (bytes) del texto devuelto por herramienta
	TokenTTL       time.Duration // vigencia del access token
	AuditFile      string        // opcional; además de stdout
	TrustProxy     bool          // leer la IP real de X-Forwarded-For (Traefik)
	RedirectHosts  []string      // hosts permitidos en redirect_uri (clientes MCP)
	BackendTimeout time.Duration
}

func env(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	if n, err := strconv.Atoi(env(k, "")); err == nil && n > 0 {
		return n
	}
	return def
}

func loadConfig() Config {
	secret := env("MCP_TOKEN_SECRET", "")
	if len(secret) < 32 {
		log.Fatal("MCP_TOKEN_SECRET es obligatorio y debe tener al menos 32 caracteres")
	}
	pub := strings.TrimRight(env("MCP_PUBLIC_URL", ""), "/")
	if pub == "" {
		log.Fatal("MCP_PUBLIC_URL es obligatorio (p. ej. https://mcp.luruacorenace.online)")
	}
	hosts := strings.Split(env("MCP_REDIRECT_HOSTS",
		"claude.ai,claude.com,chatgpt.com,chat.openai.com,platform.openai.com,localhost,127.0.0.1"), ",")
	for i := range hosts {
		hosts[i] = strings.ToLower(strings.TrimSpace(hosts[i]))
	}
	return Config{
		BackendURL:     strings.TrimRight(env("BACKEND_URL", "http://backend:8080"), "/"),
		PublicURL:      pub,
		TokenSecret:    []byte(secret),
		Addr:           ":" + env("MCP_PORT", "8090"),
		RatePerMin:     envInt("MCP_RATE_PER_MIN", 60),
		MaxResponse:    envInt("MCP_MAX_RESPONSE_BYTES", 200000),
		TokenTTL:       time.Duration(envInt("MCP_TOKEN_TTL_HOURS", 12)) * time.Hour,
		AuditFile:      env("MCP_AUDIT_FILE", ""),
		TrustProxy:     env("MCP_TRUST_PROXY", "true") == "true",
		RedirectHosts:  hosts,
		BackendTimeout: 25 * time.Second,
	}
}
