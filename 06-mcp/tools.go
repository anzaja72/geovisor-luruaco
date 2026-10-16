package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
)

// Todas las herramientas son de solo lectura: GET al backend (el copiloto usa POST,
// pero solo formula una pregunta y no modifica datos).

type Tool struct {
	Name        string
	Description string
	Props       map[string]any
	Required    []string
	Run         func(ctx context.Context, s *Server, jwt string, a map[string]any) (any, error)
}

func (t Tool) def() map[string]any {
	req := t.Required
	if req == nil {
		req = []string{}
	}
	return map[string]any{
		"name": t.Name, "description": t.Description,
		"inputSchema": map[string]any{"type": "object", "properties": t.Props, "required": req,
			"additionalProperties": false},
		"annotations": map[string]any{"readOnlyHint": true, "destructiveHint": false,
			"idempotentHint": true, "openWorldHint": false},
	}
}

func sArg(a map[string]any, k string) (string, error) {
	v, ok := a[k]
	if !ok || v == nil {
		return "", nil
	}
	s, ok := v.(string)
	if !ok {
		return "", fmt.Errorf("el argumento %q debe ser texto", k)
	}
	s = strings.TrimSpace(s)
	if len([]rune(s)) > 300 {
		return "", fmt.Errorf("el argumento %q supera 300 caracteres", k)
	}
	return s, nil
}

func iArg(a map[string]any, k string, def, max int) int {
	if f, ok := a[k].(float64); ok && f >= 1 {
		if int(f) > max {
			return max
		}
		return int(f)
	}
	return def
}

func str(p string) map[string]any { return map[string]any{"type": "string", "description": p} }

func limitar(v any, n int) any {
	if arr, ok := v.([]any); ok && len(arr) > n {
		return arr[:n]
	}
	return v
}

// filtrarLista deja solo los elementos cuyo campo `k` contiene `val` (sin mayúsculas).
func filtrarLista(v any, k, val string) any {
	arr, ok := v.([]any)
	if !ok || val == "" {
		return v
	}
	out := []any{}
	for _, it := range arr {
		if m, ok := it.(map[string]any); ok {
			if s, _ := m[k].(string); strings.Contains(strings.ToLower(s), strings.ToLower(val)) {
				out = append(out, it)
			}
		}
	}
	return out
}

func get(path string, q ...string) func(context.Context, *Server, string, map[string]any) (any, error) {
	return func(ctx context.Context, s *Server, jwt string, a map[string]any) (any, error) {
		qs := url.Values{}
		for _, k := range q {
			v, err := sArg(a, k)
			if err != nil {
				return nil, err
			}
			if v != "" {
				qs.Set(k, v)
			}
		}
		return s.backend.Get(ctx, path, qs, jwt)
	}
}

func buildTools() []Tool {
	return []Tool{
		{Name: "resumen_proyecto",
			Description: "Resumen general del proyecto de restauración de la Ciénaga de Luruaco: sitios, áreas y categorías de calidad. Opcional: periodo.",
			Props:       map[string]any{"periodo": str("Periodo de la campaña (opcional)")},
			Run:         get("/api/resumen", "periodo")},
		{Name: "indicadores_restauracion",
			Description: "Indicadores de restauración (riqueza, individuos, densidad, área basal, altura) por fecha de campaña. fecha por defecto: 'Linea base'. cobertura filtra por tipo de cobertura.",
			Props: map[string]any{"fecha": str("Campaña, p. ej. 'Linea base'"),
				"cobertura": str("Cobertura vegetal (opcional)")},
			Run: get("/api/restauracion/indicadores", "fecha", "cobertura")},
		{Name: "listar_parcelas",
			Description: "Puntos de monitoreo y parcelas permanentes (código, tipo, estado, responsable, coordenadas). Con solo_parcelas=true filtra tipo parcela.",
			Props: map[string]any{"solo_parcelas": map[string]any{"type": "boolean"},
				"limite": map[string]any{"type": "integer", "description": "Máximo de elementos (por defecto 200)"}},
			Run: func(ctx context.Context, s *Server, jwt string, a map[string]any) (any, error) {
				v, err := s.backend.Get(ctx, "/api/puntos", nil, jwt)
				if err != nil {
					return nil, err
				}
				m, ok := v.(map[string]any)
				if !ok {
					return v, nil
				}
				feats, _ := m["features"].([]any)
				if sp, _ := a["solo_parcelas"].(bool); sp {
					out := []any{}
					for _, f := range feats {
						fm, _ := f.(map[string]any)
						pr, _ := fm["properties"].(map[string]any)
						if t, _ := pr["tipo_monitoreo"].(string); strings.EqualFold(t, "parcela") {
							out = append(out, f)
						}
					}
					feats = out
				}
				m["features"] = limitar(feats, iArg(a, "limite", 200, 1000))
				return m, nil
			}},
		{Name: "listar_coberturas", Description: "Coberturas vegetales (Corine) con área y geometría simplificada.",
			Props: map[string]any{}, Run: get("/api/coberturas")},
		{Name: "fauna_grupos", Description: "Resumen de fauna por grupo taxonómico (aves, mamíferos, reptiles, etc.).",
			Props: map[string]any{}, Run: get("/api/fauna/grupos")},
		{Name: "fauna_observaciones",
			Description: "Observaciones de fauna. Filtra por grupo (p. ej. 'aves'). Máximo 500 filas.",
			Props: map[string]any{"grupo": str("Grupo de fauna (opcional)"),
				"limite": map[string]any{"type": "integer"}},
			Run: func(ctx context.Context, s *Server, jwt string, a map[string]any) (any, error) {
				g, err := sArg(a, "grupo")
				if err != nil {
					return nil, err
				}
				v, err := s.backend.Get(ctx, "/api/fauna/observaciones", nil, jwt)
				if err != nil {
					return nil, err
				}
				return limitar(filtrarLista(v, "grupo", g), iArg(a, "limite", 100, 500)), nil
			}},
		{Name: "limpiezas_maleza", Description: "Jornadas de limpieza de vegetación acuática (maleza): área acumulada y borde intervenido.",
			Props: map[string]any{}, Run: get("/api/maleza/limpiezas")},
		{Name: "mediciones_ficorremediacion",
			Description: "Mediciones de ficorremediación: calidad de agua, sedimentos y biota. Filtra por campaña.",
			Props:       map[string]any{"campana": str("Nombre de la campaña (opcional)")},
			Run: func(ctx context.Context, s *Server, jwt string, a map[string]any) (any, error) {
				c, err := sArg(a, "campana")
				if err != nil {
					return nil, err
				}
				v, err := s.backend.Get(ctx, "/api/ficor/mediciones", nil, jwt)
				if err != nil || c == "" {
					return v, err
				}
				if m, ok := v.(map[string]any); ok {
					for _, k := range []string{"agua", "sedimentos", "biota"} {
						m[k] = filtrarLista(m[k], "campana", c)
					}
				}
				return v, nil
			}},
		{Name: "actividades_gobernanza", Description: "Actividades de gobernanza: eventos, participantes y ubicación.",
			Props: map[string]any{}, Run: get("/api/gobernanza/actividades")},
		{Name: "listar_capas", Description: "Inventario de capas geográficas disponibles (las sensibles solo se listan a técnico/administrador, filtradas por el backend).",
			Props: map[string]any{}, Run: get("/api/capas")},
		{Name: "capa_geojson",
			Description: "Features GeoJSON de una capa (nombre exacto de listar_capas). Respuestas grandes se truncan.",
			Props:       map[string]any{"capa": str("Nombre de la capa")}, Required: []string{"capa"},
			Run: get("/api/capas/geojson", "capa")},
		{Name: "consultar_copiloto",
			Description: "Hace una pregunta en lenguaje natural al copiloto del geovisor, que responde con datos de la geodatabase.",
			Props:       map[string]any{"pregunta": str("Pregunta (máx. 300 caracteres)")}, Required: []string{"pregunta"},
			Run: func(ctx context.Context, s *Server, jwt string, a map[string]any) (any, error) {
				q, err := sArg(a, "pregunta")
				if err != nil || q == "" {
					return nil, fmt.Errorf("la pregunta es obligatoria")
				}
				return s.backend.Post(ctx, "/api/copiloto", map[string]string{"pregunta": q}, jwt)
			}},
	}
}

// truncar devuelve el JSON del resultado dentro de `max` bytes. Si no cabe, va
// reduciendo a la mitad la lista más larga hasta que quepa.
func truncar(v any, max int) (string, bool) {
	b, _ := json.Marshal(v)
	if len(b) <= max {
		return string(b), false
	}
	for i := 0; i < 40; i++ {
		if !acortarMayor(v) {
			break
		}
		if b, _ = json.Marshal(v); len(b) <= max {
			out := map[string]any{"_aviso": "Resultado truncado por tamaño; use filtros o 'limite'.", "datos": v}
			if ob, _ := json.Marshal(out); len(ob) <= max {
				return string(ob), true
			}
			return string(b), true
		}
	}
	r := []rune(string(b))
	for len(string(r)) > max {
		r = r[:len(r)*9/10]
	}
	return string(r), true
}

// acortarMayor reduce a la mitad la lista más larga del árbol; false si no hay.
func acortarMayor(v any) bool {
	var best []any
	var set func(n int)
	var walk func(n any)
	walk = func(n any) {
		switch t := n.(type) {
		case map[string]any:
			for k, c := range t {
				k := k
				if a, ok := c.([]any); ok && len(a) > len(best) && len(a) > 1 {
					best = a
					tt := t
					set = func(n int) { tt[k] = a[:n] }
				}
				walk(c)
			}
		case []any:
			for _, c := range t {
				walk(c)
			}
		}
	}
	walk(v)
	if best == nil {
		return false
	}
	set(len(best) / 2)
	return true
}
