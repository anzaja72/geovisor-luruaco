package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// ============================================================
// Tipos GeoJSON
// ============================================================

type FeatureCollection struct {
	Type     string    `json:"type"`
	Features []Feature `json:"features"`
}

type Feature struct {
	Type       string                 `json:"type"`
	Geometry   json.RawMessage        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

var db *sql.DB

// ============================================================
// main
// ============================================================

func main() {
	// Carga .env si existe (no es error si no está presente).
	_ = godotenv.Load()

	databaseURL := buildDatabaseURL()

	var err error
	db, err = sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Error al abrir conexión a la base de datos: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}
	log.Println("✅ Conexión a PostGIS establecida")

	app := fiber.New(fiber.Config{
		AppName: "Luruaco API - Restauración Ecológica",
	})

	// CORS configurable por entorno. Por defecto "*" (cómodo en dev),
	// pero en producción define CORS_ALLOW_ORIGINS con tu(s) dominio(s).
	allowOrigins := getEnv("CORS_ALLOW_ORIGINS", "*")
	if allowOrigins == "*" {
		log.Println("⚠️  CORS abierto a cualquier origen (*). Define CORS_ALLOW_ORIGINS en producción.")
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Use(logger.New())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"message":   "Luruaco API funcionando",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	api := app.Group("/api")
	api.Get("/zonas", getZonas)
	api.Get("/zonas/:id", getZonaByID)
	api.Get("/zonas/:id/puntos", getPuntosByZona)
	api.Get("/puntos", getPuntos)
	api.Get("/lotes", getLotes)
	api.Get("/lotes/:id", getLoteByID)
	api.Get("/resumen", getResumen)

	port := getEnv("PORT", "8080")
	log.Printf("🚀 Servidor iniciado en puerto %s", port)
	log.Fatal(app.Listen(":" + port))
}

// buildDatabaseURL arma la cadena de conexión desde DATABASE_URL o variables sueltas.
// Nota de seguridad: no hay contraseña por defecto; debe venir del entorno.
func buildDatabaseURL() string {
	if url := getEnv("DATABASE_URL", ""); url != "" {
		return url
	}
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "eco_admin"),
		getEnv("DB_PASSWORD", ""),
		getEnv("DB_NAME", "restauracion_ecologica"),
		getEnv("DB_SSLMODE", "disable"),
	)
}

// ============================================================
// Helpers comunes
// ============================================================

// setIfValid agrega una clave al mapa solo si el sql.Null* es válido.
func setStr(p map[string]interface{}, k string, v sql.NullString) {
	if v.Valid {
		p[k] = v.String
	}
}
func setFloat(p map[string]interface{}, k string, v sql.NullFloat64) {
	if v.Valid {
		p[k] = v.Float64
	}
}
func setDate(p map[string]interface{}, k string, v sql.NullTime) {
	if v.Valid {
		p[k] = v.Time.Format("2006-01-02")
	}
}

func newFeature(geojson string, props map[string]interface{}) Feature {
	return Feature{
		Type:       "Feature",
		Geometry:   json.RawMessage(geojson),
		Properties: props,
	}
}

func serverError(c *fiber.Ctx, msg string, err error) error {
	log.Printf("%s: %v", msg, err)
	return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": msg})
}

// ============================================================
// Zonas de restauración
// ============================================================

const zonaColumns = `
	id, nombre, descripcion, codigo_proyecto, tipo_ecosistema,
	estado_restauracion, area_hectareas, organizacion_responsable,
	responsable_tecnico, contacto_email, fecha_inicio_restauracion,
	fecha_estimada_fin, categoria_calidad, periodo, ST_AsGeoJSON(geom) as geojson`

// scanZona lee una fila de zona y construye su Feature GeoJSON.
func scanZona(scan func(dest ...any) error) (Feature, error) {
	var (
		id                                                          int64
		nombre, tipoEco, estado                                     string
		desc, codProy, org, tecnico, email, geojson                 sql.NullString
		categoria, periodo                                          sql.NullString
		area                                                        sql.NullFloat64
		fInicio, fFin                                               sql.NullTime
	)
	err := scan(
		&id, &nombre, &desc, &codProy, &tipoEco, &estado, &area,
		&org, &tecnico, &email, &fInicio, &fFin, &categoria, &periodo, &geojson,
	)
	if err != nil {
		return Feature{}, err
	}
	props := map[string]interface{}{
		"id":                  id,
		"nombre":              nombre,
		"tipo_ecosistema":     tipoEco,
		"estado_restauracion": estado,
	}
	setStr(props, "descripcion", desc)
	setStr(props, "codigo_proyecto", codProy)
	setFloat(props, "area_hectareas", area)
	setStr(props, "organizacion_responsable", org)
	setStr(props, "responsable_tecnico", tecnico)
	setStr(props, "contacto_email", email)
	setStr(props, "categoria_calidad", categoria)
	setStr(props, "periodo", periodo)
	setDate(props, "fecha_inicio_restauracion", fInicio)
	setDate(props, "fecha_estimada_fin", fFin)
	return newFeature(geojson.String, props), nil
}

func getZonas(c *fiber.Ctx) error {
	query := "SELECT " + zonaColumns + " FROM eco_restauracion.poligonos_restauracion ORDER BY id"
	rows, err := db.QueryContext(c.UserContext(), query)
	if err != nil {
		return serverError(c, "Error al consultar zonas", err)
	}
	defer rows.Close()

	features := []Feature{}
	for rows.Next() {
		f, err := scanZona(rows.Scan)
		if err != nil {
			log.Printf("Error al escanear zona: %v", err)
			continue
		}
		features = append(features, f)
	}
	if err := rows.Err(); err != nil {
		return serverError(c, "Error procesando zonas", err)
	}
	return c.JSON(FeatureCollection{Type: "FeatureCollection", Features: features})
}

func getZonaByID(c *fiber.Ctx) error {
	query := "SELECT " + zonaColumns + " FROM eco_restauracion.poligonos_restauracion WHERE id = $1"
	row := db.QueryRowContext(c.UserContext(), query, c.Params("id"))
	f, err := scanZona(row.Scan)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Zona no encontrada"})
	}
	if err != nil {
		return serverError(c, "Error al consultar zona", err)
	}
	return c.JSON(f)
}

const puntoColumns = `
	id, codigo_punto, nombre_punto, descripcion, tipo_monitoreo,
	metodo_muestreo, estado_punto, longitud, latitud, elevacion,
	tecnico_responsable, equipo_monitoreo, ST_AsGeoJSON(geom) as geojson`

func scanPunto(scan func(dest ...any) error) (Feature, error) {
	var (
		id                       int64
		codigo, tipoMon, estado  string
		nombre, desc, metodo     sql.NullString
		tecnico, equipo, geojson sql.NullString
		lon, lat                 float64
		elev                     sql.NullFloat64
	)
	err := scan(
		&id, &codigo, &nombre, &desc, &tipoMon, &metodo, &estado,
		&lon, &lat, &elev, &tecnico, &equipo, &geojson,
	)
	if err != nil {
		return Feature{}, err
	}
	props := map[string]interface{}{
		"id":             id,
		"codigo_punto":   codigo,
		"tipo_monitoreo": tipoMon,
		"estado_punto":   estado,
		"longitud":       lon,
		"latitud":        lat,
	}
	setStr(props, "nombre_punto", nombre)
	setStr(props, "descripcion", desc)
	setStr(props, "metodo_muestreo", metodo)
	setFloat(props, "elevacion", elev)
	setStr(props, "tecnico_responsable", tecnico)
	setStr(props, "equipo_monitoreo", equipo)
	return newFeature(geojson.String, props), nil
}

func puntosToCollection(c *fiber.Ctx, rows *sql.Rows) error {
	defer rows.Close()
	features := []Feature{}
	for rows.Next() {
		f, err := scanPunto(rows.Scan)
		if err != nil {
			log.Printf("Error escaneando punto: %v", err)
			continue
		}
		features = append(features, f)
	}
	if err := rows.Err(); err != nil {
		return serverError(c, "Error procesando puntos", err)
	}
	return c.JSON(FeatureCollection{Type: "FeatureCollection", Features: features})
}

// getPuntosByZona retorna los puntos de monitoreo de una zona específica.
func getPuntosByZona(c *fiber.Ctx) error {
	query := "SELECT " + puntoColumns +
		" FROM eco_restauracion.puntos_monitoreo WHERE poligono_id = $1 ORDER BY id"
	rows, err := db.QueryContext(c.UserContext(), query, c.Params("id"))
	if err != nil {
		return serverError(c, "Error al consultar puntos de monitoreo", err)
	}
	return puntosToCollection(c, rows)
}

// getPuntos retorna todos los puntos de monitoreo / control.
func getPuntos(c *fiber.Ctx) error {
	query := "SELECT " + puntoColumns +
		" FROM eco_restauracion.puntos_monitoreo ORDER BY id"
	rows, err := db.QueryContext(c.UserContext(), query)
	if err != nil {
		return serverError(c, "Error al consultar puntos", err)
	}
	return puntosToCollection(c, rows)
}

// ============================================================
// Lotes de bioaumentación
// ============================================================

const loteColumns = `
	id, nombre, codigo_lote, descripcion, area_hectareas,
	area_metros_cuadrados, perimetro_metros, tipo_intervencion,
	estado, puntos_referencia, metadata, categoria_calidad, periodo,
	ST_AsGeoJSON(geom) as geojson`

func scanLote(scan func(dest ...any) error) (Feature, error) {
	var (
		id                                       int64
		nombre, codigo, tipoInt, estado          string
		desc, refs, meta, categoria, periodo      sql.NullString
		areaHa, areaM2, perim                    sql.NullFloat64
		geojson                                  sql.NullString
	)
	err := scan(
		&id, &nombre, &codigo, &desc, &areaHa, &areaM2, &perim,
		&tipoInt, &estado, &refs, &meta, &categoria, &periodo, &geojson,
	)
	if err != nil {
		return Feature{}, err
	}
	props := map[string]interface{}{
		"id":                  id,
		"nombre":              nombre,
		"codigo_lote":         codigo,
		"tipo_intervencion":   tipoInt,
		"estado":              estado,
		"tipo_ecosistema":     "bioaumentacion",
		"estado_restauracion": estado,
	}
	setStr(props, "descripcion", desc)
	setFloat(props, "area_hectareas", areaHa)
	setFloat(props, "area_metros_cuadrados", areaM2)
	setFloat(props, "perimetro_metros", perim)
	setStr(props, "puntos_referencia", refs)
	setStr(props, "metadata", meta)
	setStr(props, "categoria_calidad", categoria)
	setStr(props, "periodo", periodo)
	return newFeature(geojson.String, props), nil
}

func getLotes(c *fiber.Ctx) error {
	query := "SELECT " + loteColumns + " FROM eco_restauracion.lotes_bioaumentacion ORDER BY id"
	rows, err := db.QueryContext(c.UserContext(), query)
	if err != nil {
		return serverError(c, "Error al consultar lotes", err)
	}
	defer rows.Close()

	features := []Feature{}
	for rows.Next() {
		f, err := scanLote(rows.Scan)
		if err != nil {
			log.Printf("Error al escanear lote: %v", err)
			continue
		}
		features = append(features, f)
	}
	if err := rows.Err(); err != nil {
		return serverError(c, "Error procesando lotes", err)
	}
	return c.JSON(FeatureCollection{Type: "FeatureCollection", Features: features})
}

func getLoteByID(c *fiber.Ctx) error {
	query := "SELECT " + loteColumns + " FROM eco_restauracion.lotes_bioaumentacion WHERE id = $1"
	row := db.QueryRowContext(c.UserContext(), query, c.Params("id"))
	f, err := scanLote(row.Scan)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Lote no encontrado"})
	}
	if err != nil {
		return serverError(c, "Error al consultar lote", err)
	}
	return c.JSON(f)
}

// ============================================================
// Resumen (alimenta el dashboard tipo ICAM)
// ============================================================

// ordenCategorias define el orden de la escala de calidad (peor → mejor).
var ordenCategorias = []string{"pesima", "inadecuada", "aceptable", "adecuada", "optima"}

type CategoriaResumen struct {
	Categoria  string  `json:"categoria"`
	Cantidad   int     `json:"cantidad"`
	Porcentaje float64 `json:"porcentaje"`
}

type Resumen struct {
	Periodo          string             `json:"periodo"`
	SitiosVisitados  int                `json:"sitios_visitados"`
	SitiosReportados int                `json:"sitios_reportados"`
	Categorias       []CategoriaResumen `json:"categorias"`
}

// getResumen agrega polígonos + lotes en una sola dimensión de "sitios" y
// devuelve totales y conteo/proporción por categoría de calidad.
// Filtro opcional: ?periodo=2024-2
func getResumen(c *fiber.Ctx) error {
	periodo := c.Query("periodo", "")

	const baseSitios = `
		WITH sitios AS (
			SELECT periodo, categoria_calidad FROM eco_restauracion.poligonos_restauracion
			UNION ALL
			SELECT periodo, categoria_calidad FROM eco_restauracion.lotes_bioaumentacion
		)`

	// Totales
	var visitados, reportados int
	err := db.QueryRowContext(c.UserContext(),
		baseSitios+`
		SELECT COUNT(*), COUNT(categoria_calidad)
		FROM sitios
		WHERE ($1 = '' OR periodo = $1)`, periodo,
	).Scan(&visitados, &reportados)
	if err != nil {
		return serverError(c, "Error al calcular resumen", err)
	}

	// Conteo por categoría
	rows, err := db.QueryContext(c.UserContext(),
		baseSitios+`
		SELECT categoria_calidad, COUNT(*)
		FROM sitios
		WHERE ($1 = '' OR periodo = $1) AND categoria_calidad IS NOT NULL
		GROUP BY categoria_calidad`, periodo,
	)
	if err != nil {
		return serverError(c, "Error al calcular categorías", err)
	}
	defer rows.Close()

	conteo := map[string]int{}
	for rows.Next() {
		var cat string
		var n int
		if err := rows.Scan(&cat, &n); err != nil {
			log.Printf("Error escaneando categoría: %v", err)
			continue
		}
		conteo[cat] = n
	}

	// Construir respuesta en orden fijo de la escala, solo categorías con datos.
	categorias := []CategoriaResumen{}
	for _, cat := range ordenCategorias {
		n, ok := conteo[cat]
		if !ok || n == 0 {
			continue
		}
		pct := 0.0
		if reportados > 0 {
			pct = float64(n) / float64(reportados) * 100
		}
		categorias = append(categorias, CategoriaResumen{
			Categoria:  cat,
			Cantidad:   n,
			Porcentaje: pct,
		})
	}

	if periodo == "" {
		periodo = "todos"
	}
	return c.JSON(Resumen{
		Periodo:          periodo,
		SitiosVisitados:  visitados,
		SitiosReportados: reportados,
		Categorias:       categorias,
	})
}

// ============================================================
// Utilidades
// ============================================================

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
