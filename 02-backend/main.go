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
	_ "github.com/lib/pq"
)

// Estructuras para GeoJSON
type FeatureCollection struct {
	Type     string    `json:"type"`
	Features []Feature `json:"features"`
}

type Feature struct {
	Type       string                 `json:"type"`
	Geometry   json.RawMessage        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

// Estructura para Zona de Restauración
type ZonaRestauracion struct {
	ID                    int64           `json:"id"`
	Nombre                string          `json:"nombre"`
	Descripcion           sql.NullString  `json:"descripcion"`
	CodigoProyecto        sql.NullString  `json:"codigo_proyecto"`
	TipoEcosistema        string          `json:"tipo_ecosistema"`
	EstadoRestauracion    string          `json:"estado_restauracion"`
	AreaHectareas         sql.NullFloat64 `json:"area_hectareas"`
	OrganizacionResponsable sql.NullString `json:"organizacion_responsable"`
	ResponsableTecnico    sql.NullString  `json:"responsable_tecnico"`
	ContactoEmail         sql.NullString  `json:"contacto_email"`
	FechaInicio           sql.NullTime    `json:"fecha_inicio_restauracion"`
	FechaEstimadaFin      sql.NullTime    `json:"fecha_estimada_fin"`
	GeoJSON               string          `json:"-"`
}

var db *sql.DB

func main() {
	// Configurar conexión a la base de datos desde variable de entorno
	databaseURL := getEnv("DATABASE_URL", "")
	if databaseURL == "" {
		// Fallback para desarrollo local
		dbHost := getEnv("DB_HOST", "localhost")
		dbPort := getEnv("DB_PORT", "5432")
		dbUser := getEnv("DB_USER", "eco_admin")
		dbPassword := getEnv("DB_PASSWORD", "EcoRest2024!")
		dbName := getEnv("DB_NAME", "restauracion_ecologica")
		dbSSLMode := getEnv("DB_SSLMODE", "disable")
		databaseURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)
	}

	var err error
	db, err = sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Error al abrir conexión a la base de datos: %v", err)
	}
	defer db.Close()

	// Verificar conexión
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}
	log.Println("✅ Conexión a PostGIS establecida")

	// Configurar Fiber
	app := fiber.New(fiber.Config{
		AppName: "Luruaco API - Restauración Ecológica",
	})

	// Middleware CORS - Permitir cualquier origen para el geovisor
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Use(logger.New())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"message":   "Luruaco API funcionando",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API Routes
	api := app.Group("/api")
	api.Get("/zonas", getZonas)
	api.Get("/zonas/:id", getZonaByID)
	api.Get("/zonas/:id/puntos", getPuntosByZona)
	api.Get("/lotes", getLotes)
	api.Get("/lotes/:id", getLoteByID)

	// Iniciar servidor
	port := getEnv("PORT", "8080")
	log.Printf("🚀 Servidor iniciado en puerto %s", port)
	log.Fatal(app.Listen(":" + port))
}

// getZonas retorna todas las zonas de restauración como FeatureCollection GeoJSON
func getZonas(c *fiber.Ctx) error {
	query := `
		SELECT 
			id, nombre, descripcion, codigo_proyecto, tipo_ecosistema,
			estado_restauracion, area_hectareas, organizacion_responsable,
			responsable_tecnico, contacto_email, fecha_inicio_restauracion,
			fecha_estimada_fin, ST_AsGeoJSON(geom) as geojson
		FROM eco_restauracion.poligonos_restauracion
		ORDER BY id
	`

	rows, err := db.QueryContext(context.Background(), query)
	if err != nil {
		log.Printf("Error en consulta: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al consultar zonas",
		})
	}
	defer rows.Close()

	var features []Feature

	for rows.Next() {
		var zona ZonaRestauracion
		err := rows.Scan(
			&zona.ID, &zona.Nombre, &zona.Descripcion, &zona.CodigoProyecto,
			&zona.TipoEcosistema, &zona.EstadoRestauracion, &zona.AreaHectareas,
			&zona.OrganizacionResponsable, &zona.ResponsableTecnico, &zona.ContactoEmail,
			&zona.FechaInicio, &zona.FechaEstimadaFin, &zona.GeoJSON,
		)
		if err != nil {
			log.Printf("Error al escanear fila: %v", err)
			continue
		}

		properties := map[string]interface{}{
			"id":                     zona.ID,
			"nombre":                 zona.Nombre,
			"tipo_ecosistema":        zona.TipoEcosistema,
			"estado_restauracion":    zona.EstadoRestauracion,
		}

		if zona.Descripcion.Valid {
			properties["descripcion"] = zona.Descripcion.String
		}
		if zona.CodigoProyecto.Valid {
			properties["codigo_proyecto"] = zona.CodigoProyecto.String
		}
		if zona.AreaHectareas.Valid {
			properties["area_hectareas"] = zona.AreaHectareas.Float64
		}
		if zona.OrganizacionResponsable.Valid {
			properties["organizacion_responsable"] = zona.OrganizacionResponsable.String
		}
		if zona.ResponsableTecnico.Valid {
			properties["responsable_tecnico"] = zona.ResponsableTecnico.String
		}
		if zona.ContactoEmail.Valid {
			properties["contacto_email"] = zona.ContactoEmail.String
		}
		if zona.FechaInicio.Valid {
			properties["fecha_inicio_restauracion"] = zona.FechaInicio.Time.Format("2006-01-02")
		}
		if zona.FechaEstimadaFin.Valid {
			properties["fecha_estimada_fin"] = zona.FechaEstimadaFin.Time.Format("2006-01-02")
		}

		feature := Feature{
			Type:       "Feature",
			Geometry:   json.RawMessage(zona.GeoJSON),
			Properties: properties,
		}
		features = append(features, feature)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterando filas: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error procesando resultados",
		})
	}

	featureCollection := FeatureCollection{
		Type:     "FeatureCollection",
		Features: features,
	}

	return c.JSON(featureCollection)
}

// getZonaByID retorna una zona específica por ID
func getZonaByID(c *fiber.Ctx) error {
	id := c.Params("id")
	
	query := `
		SELECT 
			id, nombre, descripcion, codigo_proyecto, tipo_ecosistema,
			estado_restauracion, area_hectareas, organizacion_responsable,
			responsable_tecnico, contacto_email, fecha_inicio_restauracion,
			fecha_estimada_fin, ST_AsGeoJSON(geom) as geojson
		FROM eco_restauracion.poligonos_restauracion
		WHERE id = $1
	`

	var zona ZonaRestauracion
	err := db.QueryRowContext(context.Background(), query, id).Scan(
		&zona.ID, &zona.Nombre, &zona.Descripcion, &zona.CodigoProyecto,
		&zona.TipoEcosistema, &zona.EstadoRestauracion, &zona.AreaHectareas,
		&zona.OrganizacionResponsable, &zona.ResponsableTecnico, &zona.ContactoEmail,
		&zona.FechaInicio, &zona.FechaEstimadaFin, &zona.GeoJSON,
	)

	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Zona no encontrada",
		})
	}
	if err != nil {
		log.Printf("Error consultando zona: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al consultar zona",
		})
	}

	properties := map[string]interface{}{
		"id":                  zona.ID,
		"nombre":              zona.Nombre,
		"tipo_ecosistema":     zona.TipoEcosistema,
		"estado_restauracion": zona.EstadoRestauracion,
	}

	if zona.Descripcion.Valid {
		properties["descripcion"] = zona.Descripcion.String
	}
	if zona.CodigoProyecto.Valid {
		properties["codigo_proyecto"] = zona.CodigoProyecto.String
	}
	if zona.AreaHectareas.Valid {
		properties["area_hectareas"] = zona.AreaHectareas.Float64
	}
	if zona.OrganizacionResponsable.Valid {
		properties["organizacion_responsable"] = zona.OrganizacionResponsable.String
	}
	if zona.ResponsableTecnico.Valid {
		properties["responsable_tecnico"] = zona.ResponsableTecnico.String
	}
	if zona.ContactoEmail.Valid {
		properties["contacto_email"] = zona.ContactoEmail.String
	}
	if zona.FechaInicio.Valid {
		properties["fecha_inicio_restauracion"] = zona.FechaInicio.Time.Format("2006-01-02")
	}
	if zona.FechaEstimadaFin.Valid {
		properties["fecha_estimada_fin"] = zona.FechaEstimadaFin.Time.Format("2006-01-02")
	}

	feature := Feature{
		Type:       "Feature",
		Geometry:   json.RawMessage(zona.GeoJSON),
		Properties: properties,
	}

	return c.JSON(feature)
}

// getPuntosByZona retorna los puntos de monitoreo de una zona específica
func getPuntosByZona(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `
		SELECT 
			pm.id, pm.codigo_punto, pm.nombre_punto, pm.descripcion,
			pm.tipo_monitoreo, pm.metodo_muestreo, pm.estado_punto,
			pm.longitud, pm.latitud, pm.elevacion,
			pm.tecnico_responsable, pm.equipo_monitoreo,
			ST_AsGeoJSON(pm.geom) as geojson
		FROM eco_restauracion.puntos_monitoreo pm
		WHERE pm.poligono_id = $1
		ORDER BY pm.id
	`

	rows, err := db.QueryContext(context.Background(), query, id)
	if err != nil {
		log.Printf("Error consultando puntos: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al consultar puntos de monitoreo",
		})
	}
	defer rows.Close()

	type PuntoMonitoreo struct {
		ID                 int64          `json:"id"`
		CodigoPunto        string         `json:"codigo_punto"`
		NombrePunto        sql.NullString `json:"nombre_punto"`
		Descripcion        sql.NullString `json:"descripcion"`
		TipoMonitoreo      string         `json:"tipo_monitoreo"`
		MetodoMuestreo     sql.NullString `json:"metodo_muestreo"`
		EstadoPunto        string         `json:"estado_punto"`
		Longitud           float64        `json:"longitud"`
		Latitud            float64        `json:"latitud"`
		Elevacion          sql.NullFloat64 `json:"elevacion"`
		TecnicoResponsable sql.NullString `json:"tecnico_responsable"`
		EquipoMonitoreo    sql.NullString `json:"equipo_monitoreo"`
		GeoJSON            string         `json:"-"`
	}

	var features []Feature

	for rows.Next() {
		var punto PuntoMonitoreo
		err := rows.Scan(
			&punto.ID, &punto.CodigoPunto, &punto.NombrePunto, &punto.Descripcion,
			&punto.TipoMonitoreo, &punto.MetodoMuestreo, &punto.EstadoPunto,
			&punto.Longitud, &punto.Latitud, &punto.Elevacion,
			&punto.TecnicoResponsable, &punto.EquipoMonitoreo, &punto.GeoJSON,
		)
		if err != nil {
			log.Printf("Error escaneando punto: %v", err)
			continue
		}

		properties := map[string]interface{}{
			"id":             punto.ID,
			"codigo_punto":   punto.CodigoPunto,
			"tipo_monitoreo": punto.TipoMonitoreo,
			"estado_punto":   punto.EstadoPunto,
			"longitud":       punto.Longitud,
			"latitud":        punto.Latitud,
		}

		if punto.NombrePunto.Valid {
			properties["nombre_punto"] = punto.NombrePunto.String
		}
		if punto.Descripcion.Valid {
			properties["descripcion"] = punto.Descripcion.String
		}
		if punto.MetodoMuestreo.Valid {
			properties["metodo_muestreo"] = punto.MetodoMuestreo.String
		}
		if punto.Elevacion.Valid {
			properties["elevacion"] = punto.Elevacion.Float64
		}
		if punto.TecnicoResponsable.Valid {
			properties["tecnico_responsable"] = punto.TecnicoResponsable.String
		}
		if punto.EquipoMonitoreo.Valid {
			properties["equipo_monitoreo"] = punto.EquipoMonitoreo.String
		}

		feature := Feature{
			Type:       "Feature",
			Geometry:   json.RawMessage(punto.GeoJSON),
			Properties: properties,
		}
		features = append(features, feature)
	}

	featureCollection := FeatureCollection{
		Type:     "FeatureCollection",
		Features: features,
	}

	return c.JSON(featureCollection)
}

// Estructura para Lote de Bioaumentación
type LoteBioaumentacion struct {
	ID                  int64           `json:"id"`
	Nombre              string          `json:"nombre"`
	CodigoLote          string          `json:"codigo_lote"`
	Descripcion         sql.NullString  `json:"descripcion"`
	AreaHectareas       sql.NullFloat64 `json:"area_hectareas"`
	AreaMetrosCuadrados sql.NullFloat64 `json:"area_metros_cuadrados"`
	PerimetroMetros     sql.NullFloat64 `json:"perimetro_metros"`
	TipoIntervencion    string          `json:"tipo_intervencion"`
	Estado              string          `json:"estado"`
	PuntosReferencia    sql.NullString  `json:"puntos_referencia"`
	Metadata            sql.NullString  `json:"metadata"`
	FechaCreacion       time.Time       `json:"fecha_creacion"`
	FechaActualizacion  time.Time       `json:"fecha_actualizacion"`
	GeoJSON             string          `json:"-"`
}

// getLotes retorna todos los lotes de bioaumentación como FeatureCollection GeoJSON
func getLotes(c *fiber.Ctx) error {
	query := `
		SELECT 
			id, nombre, codigo_lote, descripcion, area_hectareas,
			area_metros_cuadrados, perimetro_metros, tipo_intervencion,
			estado, puntos_referencia, metadata, fecha_creacion,
			fecha_actualizacion, ST_AsGeoJSON(geom) as geojson
		FROM eco_restauracion.lotes_bioaumentacion
		ORDER BY id
	`

	rows, err := db.QueryContext(context.Background(), query)
	if err != nil {
		log.Printf("Error en consulta de lotes: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al consultar lotes",
		})
	}
	defer rows.Close()

	var features []Feature

	for rows.Next() {
		var lote LoteBioaumentacion
		err := rows.Scan(
			&lote.ID, &lote.Nombre, &lote.CodigoLote, &lote.Descripcion,
			&lote.AreaHectareas, &lote.AreaMetrosCuadrados, &lote.PerimetroMetros,
			&lote.TipoIntervencion, &lote.Estado, &lote.PuntosReferencia,
			&lote.Metadata, &lote.FechaCreacion, &lote.FechaActualizacion, &lote.GeoJSON,
		)
		if err != nil {
			log.Printf("Error al escanear fila de lote: %v", err)
			continue
		}

		properties := map[string]interface{}{
			"id":                lote.ID,
			"nombre":            lote.Nombre,
			"codigo_lote":       lote.CodigoLote,
			"tipo_intervencion": lote.TipoIntervencion,
			"estado":            lote.Estado,
			"tipo_ecosistema":   "bioaumentacion",
			"estado_restauracion": lote.Estado,
		}

		if lote.Descripcion.Valid {
			properties["descripcion"] = lote.Descripcion.String
		}
		if lote.AreaHectareas.Valid {
			properties["area_hectareas"] = lote.AreaHectareas.Float64
		}
		if lote.AreaMetrosCuadrados.Valid {
			properties["area_metros_cuadrados"] = lote.AreaMetrosCuadrados.Float64
		}
		if lote.PerimetroMetros.Valid {
			properties["perimetro_metros"] = lote.PerimetroMetros.Float64
		}
		if lote.PuntosReferencia.Valid {
			properties["puntos_referencia"] = lote.PuntosReferencia.String
		}
		if lote.Metadata.Valid {
			properties["metadata"] = lote.Metadata.String
		}

		feature := Feature{
			Type:       "Feature",
			Geometry:   json.RawMessage(lote.GeoJSON),
			Properties: properties,
		}
		features = append(features, feature)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterando filas de lotes: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error procesando resultados de lotes",
		})
	}

	featureCollection := FeatureCollection{
		Type:     "FeatureCollection",
		Features: features,
	}

	return c.JSON(featureCollection)
}

// getLoteByID retorna un lote específico por ID
func getLoteByID(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `
		SELECT 
			id, nombre, codigo_lote, descripcion, area_hectareas,
			area_metros_cuadrados, perimetro_metros, tipo_intervencion,
			estado, puntos_referencia, metadata, fecha_creacion,
			fecha_actualizacion, ST_AsGeoJSON(geom) as geojson
		FROM eco_restauracion.lotes_bioaumentacion
		WHERE id = $1
	`

	var lote LoteBioaumentacion
	err := db.QueryRowContext(context.Background(), query, id).Scan(
		&lote.ID, &lote.Nombre, &lote.CodigoLote, &lote.Descripcion,
		&lote.AreaHectareas, &lote.AreaMetrosCuadrados, &lote.PerimetroMetros,
		&lote.TipoIntervencion, &lote.Estado, &lote.PuntosReferencia,
		&lote.Metadata, &lote.FechaCreacion, &lote.FechaActualizacion, &lote.GeoJSON,
	)

	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Lote no encontrado",
		})
	}
	if err != nil {
		log.Printf("Error consultando lote: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al consultar lote",
		})
	}

	properties := map[string]interface{}{
		"id":                lote.ID,
		"nombre":            lote.Nombre,
		"codigo_lote":       lote.CodigoLote,
		"tipo_intervencion": lote.TipoIntervencion,
		"estado":            lote.Estado,
		"tipo_ecosistema":   "bioaumentacion",
		"estado_restauracion": lote.Estado,
	}

	if lote.Descripcion.Valid {
		properties["descripcion"] = lote.Descripcion.String
	}
	if lote.AreaHectareas.Valid {
		properties["area_hectareas"] = lote.AreaHectareas.Float64
	}
	if lote.AreaMetrosCuadrados.Valid {
		properties["area_metros_cuadrados"] = lote.AreaMetrosCuadrados.Float64
	}
	if lote.PerimetroMetros.Valid {
		properties["perimetro_metros"] = lote.PerimetroMetros.Float64
	}
	if lote.PuntosReferencia.Valid {
		properties["puntos_referencia"] = lote.PuntosReferencia.String
	}
	if lote.Metadata.Valid {
		properties["metadata"] = lote.Metadata.String
	}

	feature := Feature{
		Type:       "Feature",
		Geometry:   json.RawMessage(lote.GeoJSON),
		Properties: properties,
	}

	return c.JSON(feature)
}

// getEnv obtiene variable de entorno o valor por defecto
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}