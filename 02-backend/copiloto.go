package main

// Copiloto del geovisor: responde preguntas sobre el proyecto con las cifras que
// están en la geodatabase, no con texto genérico.
//
// El modelo de lenguaje solo REDACTA: las cifras se leen antes de PostGIS y se le
// entregan como contexto, con la instrucción de no inventar ninguna. Si no hay
// proveedor configurado —o si falla— el copiloto sigue respondiendo con esas
// mismas cifras en modo sin modelo, así que nunca queda mudo.
//
// El proveedor se configura por entorno y habla el protocolo de OpenAI, que es el
// que exponen NVIDIA NIM, DeepSeek y la mayoría:
//
//	LLM_BASE_URL  (por defecto https://integrate.api.nvidia.com/v1)
//	LLM_API_KEY   (sin ella, modo sin modelo)
//	LLM_MODEL     (por defecto meta/llama-3.3-70b-instruct)
//
// La clave vive solo aquí: el navegador nunca la ve.

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// ---------------------------------------------------------------- Configuración

const (
	llmTimeout      = 25 * time.Second
	maxPregunta     = 500 // caracteres
	limitePorMinuto = 12  // consultas por usuario
)

func llmConfig() (baseURL, apiKey, modelo string) {
	return getEnv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
		getEnv("LLM_API_KEY", ""),
		getEnv("LLM_MODEL", "meta/llama-3.3-70b-instruct")
}

// ------------------------------------------------------------------ Límite de uso

type contador struct {
	mu    sync.Mutex
	visto map[int64][]time.Time
}

var uso = contador{visto: map[int64][]time.Time{}}

// permite devuelve false cuando el usuario supera el límite del último minuto.
func (c *contador) permite(uid int64) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	corte := time.Now().Add(-time.Minute)
	recientes := c.visto[uid][:0]
	for _, t := range c.visto[uid] {
		if t.After(corte) {
			recientes = append(recientes, t)
		}
	}
	if len(recientes) >= limitePorMinuto {
		c.visto[uid] = recientes
		return false
	}
	c.visto[uid] = append(recientes, time.Now())
	return true
}

// ------------------------------------------------------------- Datos del proyecto

// bloque es un fragmento de contexto: un tema con sus cifras y de dónde salen.
type bloque struct {
	Tema     string   `json:"tema"`
	Texto    string   `json:"texto"`
	Fuente   string   `json:"fuente"`
	Vista    string   `json:"vista,omitempty"`    // componente del geovisor al que lleva
	Palabras []string `json:"-"`                  // términos que activan el bloque
}

// briefing arma la foto actual del proyecto leyendo la base de datos. Es pequeño
// —unas pocas cifras por componente— así que se entrega completo al modelo en vez
// de montar un esquema de herramientas: menos piezas y ningún dato inventado.
func briefing(c *fiber.Ctx) []bloque {
	ctx := c.UserContext()
	out := []bloque{}
	num := func(q string, args ...any) (float64, bool) {
		var v sql.NullFloat64
		if err := db.QueryRowContext(ctx, q, args...).Scan(&v); err != nil || !v.Valid {
			return 0, false
		}
		return v.Float64, true
	}

	// --- Restauración: superficie por tipo de intervención y censo forestal
	activa, okA := num(`SELECT COALESCE(SUM(area_hectareas),0) FROM eco_restauracion.coberturas_vegetales
	                    WHERE descripcion !~* 'bosque'`)
	pasiva, okP := num(`SELECT COALESCE(SUM(area_hectareas),0) FROM eco_restauracion.coberturas_vegetales
	                    WHERE descripcion ~* 'bosque'`)
	total, _ := num(`SELECT COALESCE(SUM(area_hectareas),0) FROM eco_restauracion.coberturas_vegetales`)
	if okA && okP {
		out = append(out, bloque{
			Tema: "Restauración ecológica",
			Texto: fmt.Sprintf("Área analizada %.2f ha. Restauración activa %.2f ha "+
				"(mosaico de cultivos, vegetación secundaria y tierras desnudas); restauración pasiva "+
				"%.2f ha (bosque denso y de galería, destinados a preservación).", total, activa, pasiva),
			Fuente: "Coberturas Corine del levantamiento con dron",
			Vista:  "restauracion",
			Palabras: []string{"restaura", "hectárea", "hectarea", "área", "area", "activa", "pasiva",
				"cobertura", "superficie", "predio"},
		})
	}

	var especies, individuos, fustes int
	var altura, shannon sql.NullFloat64
	err := db.QueryRowContext(ctx, `
		SELECT COUNT(DISTINCT especie) FILTER (WHERE especie IS NOT NULL),
		       COUNT(*) FILTER (WHERE especie IS NOT NULL),
		       COALESCE(SUM(n_fustes),0), AVG(altura_max), NULL
		FROM eco_restauracion.arboles_monitoreo WHERE fecha = 'Linea base'`).
		Scan(&especies, &individuos, &fustes, &altura, &shannon)
	if err == nil && individuos > 0 {
		out = append(out, bloque{
			Tema: "Censo forestal",
			Texto: fmt.Sprintf("Línea base (julio 2026): %d individuos censados, %d especies, %d fustes medidos, "+
				"altura media %.1f m. Además se recibieron 17.565 plántulas del vivero, plantadas en tierras "+
				"desnudas y degradadas y en mosaico de cultivos con la HMP de sistema agroforestal.",
				individuos, especies, fustes, altura.Float64),
			Fuente:   "Censo arboles_monitoreo",
			Vista:    "restauracion",
			Palabras: []string{"árbol", "arbol", "censo", "especie", "siembra", "plántula", "plantula", "riqueza", "densidad", "fuste", "altura"},
		})
	}

	// --- Parcelas de monitoreo con su nomenclatura
	rows, err := db.QueryContext(ctx, `
		SELECT codigo_punto, COALESCE(descripcion,'') FROM eco_restauracion.puntos_monitoreo
		WHERE tipo_monitoreo = 'parcela' ORDER BY codigo_punto`)
	if err == nil {
		defer rows.Close()
		var codigos []string
		for rows.Next() {
			var cod, desc string
			if rows.Scan(&cod, &desc) == nil {
				codigos = append(codigos, cod)
			}
		}
		if len(codigos) > 0 {
			out = append(out, bloque{
				Tema:     "Parcelas de monitoreo",
				Texto:    fmt.Sprintf("%d parcelas permanentes, con nomenclatura %s.", len(codigos), strings.Join(codigos, ", ")),
				Fuente:   "puntos_monitoreo",
				Vista:    "restauracion",
				Palabras: []string{"parcela", "nomenclatura", "punto", "estación", "estacion", "bd1", "dd", "cu", "vs"},
			})
		}
	}

	// --- Fauna
	var faunaN, faunaSp int
	if db.QueryRowContext(ctx, `SELECT COALESCE(SUM(n_individuos),0), COUNT(DISTINCT nombre_cientifico)
	                            FROM eco_restauracion.fauna_observaciones`).Scan(&faunaN, &faunaSp) == nil && faunaSp > 0 {
		out = append(out, bloque{
			Tema: "Monitoreo de fauna",
			Texto: fmt.Sprintf("Línea base de fauna: %d individuos registrados de %d especies, en aves, mamíferos, "+
				"anfibios y reptiles. El geovisor incluye un visor 3D con el espécimen representativo de cada grupo.",
				faunaN, faunaSp),
			Fuente:   "fauna_observaciones",
			Vista:    "fauna",
			Palabras: []string{"fauna", "ave", "mamífero", "mamifero", "anfibio", "reptil", "animal", "biodiversidad", "3d"},
		})
	}

	// --- Vegetación acuática
	var mAreas sql.NullFloat64
	var mJornadas int
	if db.QueryRowContext(ctx, `SELECT COUNT(*), COALESCE(SUM(area_ha),0) FROM eco_restauracion.maleza_limpieza`).
		Scan(&mJornadas, &mAreas) == nil && mJornadas > 0 {
		out = append(out, bloque{
			Tema:     "Vegetación acuática",
			Texto:    fmt.Sprintf("%d jornadas de limpieza registradas, %.2f ha intervenidas en la laguna.", mJornadas, mAreas.Float64),
			Fuente:   "maleza_limpieza",
			Vista:    "maleza",
			Palabras: []string{"maleza", "acuática", "acuatica", "limpieza", "laguna", "buchón", "buchon"},
		})
	}

	// --- Gobernanza
	var gEventos, gPart int
	if db.QueryRowContext(ctx, `SELECT COALESCE(SUM(cantidad),0), COALESCE(SUM(participantes),0)
	                            FROM eco_restauracion.gobernanza_actividades`).Scan(&gEventos, &gPart) == nil && gEventos > 0 {
		out = append(out, bloque{
			Tema:     "Gobernanza ambiental",
			Texto:    fmt.Sprintf("%d eventos realizados con %d participantes: socializaciones, talleres de acuerdo social, capacitaciones, jornadas de limpieza, recorridos guiados y negocios verdes.", gEventos, gPart),
			Fuente:   "gobernanza_actividades",
			Vista:    "gobernanza",
			Palabras: []string{"gobernanza", "taller", "capacitación", "capacitacion", "participante", "comunidad", "social", "evento"},
		})
	}

	// --- Vacíos declarados: es preferible decirlo a que el modelo improvise
	var ficor int
	_ = db.QueryRowContext(ctx, `SELECT COUNT(*) FROM eco_restauracion.puntos_monitoreo
	                             WHERE tipo_monitoreo = 'ficorremediacion'`).Scan(&ficor)
	out = append(out, bloque{
		Tema: "Datos aún no levantados",
		Texto: "Ficorremediación no tiene todavía parámetros de calidad de agua ni de sedimentos cargados. " +
			"Las campañas Monitoreo 1 a 4 del censo forestal aún no tienen mediciones de campo. " +
			"El registro fotográfico por parcela está pendiente de entrega.",
		Fuente:   "Estado de la geodatabase",
		Palabras: []string{"ficorremediación", "ficorremediacion", "agua", "sedimento", "pendiente", "falta", "monitoreo 1", "calidad"},
	})

	return out
}

// pertinentes escoge los bloques que responden a la pregunta. Si ninguno coincide
// se devuelven todos: el contexto es corto y es mejor sobrar que quedarse corto.
func pertinentes(bs []bloque, pregunta string) []bloque {
	q := strings.ToLower(pregunta)
	sel := []bloque{}
	for _, b := range bs {
		for _, p := range b.Palabras {
			if strings.Contains(q, p) {
				sel = append(sel, b)
				break
			}
		}
	}
	if len(sel) == 0 {
		return bs
	}
	return sel
}

// ------------------------------------------------------------------ Proveedor LLM

type mensajeLLM struct {
	Rol       string `json:"role"`
	Contenido string `json:"content"`
}

// redactar pide al proveedor que convierta las cifras en una respuesta en prosa.
// Devuelve cadena vacía si no hay proveedor o si la llamada falla, para que el
// manejador siga con la respuesta sin modelo.
func redactar(pregunta string, ctxBloques []bloque) (string, string) {
	baseURL, apiKey, modelo := llmConfig()
	if apiKey == "" {
		return "", ""
	}

	var datos strings.Builder
	for _, b := range ctxBloques {
		fmt.Fprintf(&datos, "- %s: %s (fuente: %s)\n", b.Tema, b.Texto, b.Fuente)
	}

	sistema := "Eres el asistente del geovisor de restauración ecológica de la Ciénaga de Luruaco, " +
		"proyecto de la Corporación Autónoma Regional del Atlántico (C.R.A.). " +
		"Respondes en español, en tono claro y profesional, en un máximo de cuatro frases. " +
		"REGLA ABSOLUTA: solo puedes usar las cifras que aparecen en los DATOS; nunca inventes ni " +
		"estimes números. Si el dato no está, dilo con naturalidad e indica que aún no se ha levantado " +
		"en campo. No uses viñetas ni encabezados: responde en prosa."

	cuerpo, _ := json.Marshal(map[string]any{
		"model": modelo,
		"messages": []mensajeLLM{
			{Rol: "system", Contenido: sistema},
			{Rol: "user", Contenido: "DATOS:\n" + datos.String() + "\nPREGUNTA: " + pregunta},
		},
		"temperature": 0.2,
		"max_tokens":  350,
	})

	req, err := http.NewRequest("POST", strings.TrimRight(baseURL, "/")+"/chat/completions", bytes.NewReader(cuerpo))
	if err != nil {
		return "", ""
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	res, err := (&http.Client{Timeout: llmTimeout}).Do(req)
	if err != nil {
		return "", ""
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		io.Copy(io.Discard, res.Body)
		return "", ""
	}

	var out struct {
		Choices []struct {
			Message mensajeLLM `json:"message"`
		} `json:"choices"`
	}
	if json.NewDecoder(res.Body).Decode(&out) != nil || len(out.Choices) == 0 {
		return "", ""
	}
	return strings.TrimSpace(out.Choices[0].Message.Contenido), modelo
}

// sinModelo compone la respuesta directamente con los datos, sin pasar por el
// proveedor. Es el comportamiento cuando no hay clave configurada o el servicio
// no responde.
func sinModelo(bs []bloque) string {
	var s strings.Builder
	for i, b := range bs {
		if i > 0 {
			s.WriteString(" ")
		}
		s.WriteString(b.Texto)
	}
	return s.String()
}

// ---------------------------------------------------------------------- Endpoint

type respuestaCopiloto struct {
	Respuesta string   `json:"respuesta"`
	Fuentes   []string `json:"fuentes"`
	Vistas    []string `json:"vistas"`
	Modelo    string   `json:"modelo"`
	ConModelo bool     `json:"con_modelo"`
}

// POST /api/copiloto  — cualquier usuario autenticado
func copiloto(c *fiber.Ctx) error {
	var body struct {
		Pregunta string `json:"pregunta"`
	}
	if err := c.BodyParser(&body); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	pregunta := strings.TrimSpace(body.Pregunta)
	if pregunta == "" {
		return badReq(c, "La pregunta es obligatoria")
	}
	if len([]rune(pregunta)) > maxPregunta {
		return badReq(c, fmt.Sprintf("La pregunta no puede superar %d caracteres", maxPregunta))
	}

	u, _ := c.Locals("user").(*Claims)
	if u != nil && !uso.permite(u.UserID) {
		return c.Status(http.StatusTooManyRequests).
			JSON(fiber.Map{"error": "Demasiadas consultas seguidas; espera un momento."})
	}

	sel := pertinentes(briefing(c), pregunta)

	texto, modelo := redactar(pregunta, sel)
	conModelo := texto != ""
	if !conModelo {
		texto = sinModelo(sel)
	}

	fuentes, vistas := []string{}, []string{}
	vistoV := map[string]bool{}
	for _, b := range sel {
		fuentes = append(fuentes, b.Fuente)
		if b.Vista != "" && !vistoV[b.Vista] {
			vistoV[b.Vista] = true
			vistas = append(vistas, b.Vista)
		}
	}

	// Registro de la consulta: sirve para saber qué necesita la gente y para el
	// informe de uso. Que falle no debe tumbar la respuesta.
	if u != nil {
		_, _ = db.ExecContext(c.UserContext(), `
			INSERT INTO eco_restauracion.copiloto_consultas (usuario_id, pregunta, con_modelo, modelo)
			VALUES ($1, $2, $3, $4)`, u.UserID, pregunta, conModelo, modelo)
	}

	return c.JSON(respuestaCopiloto{
		Respuesta: texto, Fuentes: fuentes, Vistas: vistas,
		Modelo: modelo, ConModelo: conModelo,
	})
}
