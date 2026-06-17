package main

// Capas temáticas de restauración (componentes solicitados por la interventoría):
// estratos de vegetación, malezas, técnicas, sitios de validación y fotografías.
// Todas de solo lectura (cualquier usuario autenticado).

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
)

// fcFromRows arma un FeatureCollection: cada fila = (geojson, props...).
func fcFromRows(c *fiber.Ctx, rows *sql.Rows, build func(scan func(...any) error) (Feature, bool)) error {
	defer rows.Close()
	features := []Feature{}
	for rows.Next() {
		f, ok := build(rows.Scan)
		if ok {
			features = append(features, f)
		}
	}
	return c.JSON(FeatureCollection{Type: "FeatureCollection", Features: features})
}

func getEstratos(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT estrato, COALESCE(cobertura_pct,0), COALESCE(altura_m,0),
		       COALESCE(fecha::text,''), COALESCE(periodo,''), COALESCE(origen,''),
		       COALESCE(descripcion,''), ST_AsGeoJSON(geom)
		FROM eco_restauracion.estratos_vegetacion ORDER BY id`)
	if err != nil {
		return serverError(c, "Error al consultar estratos", err)
	}
	return fcFromRows(c, rows, func(scan func(...any) error) (Feature, bool) {
		var estrato, fecha, periodo, origen, desc, geo string
		var cob, alt float64
		if scan(&estrato, &cob, &alt, &fecha, &periodo, &origen, &desc, &geo) != nil {
			return Feature{}, false
		}
		return newFeature(geo, map[string]interface{}{
			"tipo": "estrato", "estrato": estrato, "cobertura_pct": cob, "altura_m": alt,
			"fecha": fecha, "periodo": periodo, "origen": origen, "descripcion": desc,
		}), true
	})
}

func getMalezas(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT especie, COALESCE(cobertura_pct,0), estado, COALESCE(fecha::text,''),
		       COALESCE(origen,''), COALESCE(observaciones,''), ST_AsGeoJSON(geom)
		FROM eco_restauracion.malezas ORDER BY id`)
	if err != nil {
		return serverError(c, "Error al consultar malezas", err)
	}
	return fcFromRows(c, rows, func(scan func(...any) error) (Feature, bool) {
		var especie, estado, fecha, origen, obs, geo string
		var cob float64
		if scan(&especie, &cob, &estado, &fecha, &origen, &obs, &geo) != nil {
			return Feature{}, false
		}
		return newFeature(geo, map[string]interface{}{
			"tipo": "maleza", "especie": especie, "cobertura_pct": cob, "estado": estado,
			"fecha": fecha, "origen": origen, "observaciones": obs,
		}), true
	})
}

func getTecnicas(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT tecnica, COALESCE(descripcion,''), COALESCE(fecha::text,''),
		       COALESCE(area_hectareas,0), COALESCE(responsable,''), COALESCE(origen,''),
		       ST_AsGeoJSON(geom)
		FROM eco_restauracion.tecnicas_restauracion ORDER BY id`)
	if err != nil {
		return serverError(c, "Error al consultar técnicas", err)
	}
	return fcFromRows(c, rows, func(scan func(...any) error) (Feature, bool) {
		var tecnica, desc, fecha, resp, origen, geo string
		var area float64
		if scan(&tecnica, &desc, &fecha, &area, &resp, &origen, &geo) != nil {
			return Feature{}, false
		}
		return newFeature(geo, map[string]interface{}{
			"tipo": "tecnica", "tecnica": tecnica, "descripcion": desc, "fecha": fecha,
			"area_hectareas": area, "responsable": resp, "origen": origen,
		}), true
	})
}

// getValidacion: estaciones con su monitoreo de validación más reciente,
// calculando el % de cumplimiento (valor/meta*100).
func getValidacion(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT DISTINCT ON (pm.id)
		       pm.codigo_punto, COALESCE(pm.nombre_punto,''), m.indicador,
		       m.valor, COALESCE(m.unidad,''), m.meta,
		       CASE WHEN m.meta IS NOT NULL AND m.meta <> 0
		            THEN ROUND((m.valor/m.meta*100)::numeric,1) ELSE NULL END AS cumplimiento,
		       m.fecha::text, ST_AsGeoJSON(pm.geom)
		FROM eco_restauracion.puntos_monitoreo pm
		JOIN eco_restauracion.monitoreos m ON m.estacion_id = pm.id AND m.es_validacion
		ORDER BY pm.id, m.fecha DESC`)
	if err != nil {
		return serverError(c, "Error al consultar validación", err)
	}
	return fcFromRows(c, rows, func(scan func(...any) error) (Feature, bool) {
		var codigo, nombre, indicador, unidad, fecha, geo string
		var valor float64
		var meta, cumpl sql.NullFloat64
		if scan(&codigo, &nombre, &indicador, &valor, &unidad, &meta, &cumpl, &fecha, &geo) != nil {
			return Feature{}, false
		}
		props := map[string]interface{}{
			"tipo": "validacion", "codigo": codigo, "nombre": nombre,
			"indicador": indicador, "valor": valor, "unidad": unidad, "fecha": fecha,
		}
		if meta.Valid {
			props["meta"] = meta.Float64
		}
		if cumpl.Valid {
			props["cumplimiento"] = cumpl.Float64
		}
		return newFeature(geo, props), true
	})
}

func getFotografias(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT COALESCE(descripcion,''), COALESCE(fecha::text,''),
		       COALESCE(ruta_archivo,''), COALESCE(drive_id,''), ST_AsGeoJSON(geom)
		FROM eco_restauracion.fotografias WHERE geom IS NOT NULL ORDER BY id`)
	if err != nil {
		return serverError(c, "Error al consultar fotografías", err)
	}
	return fcFromRows(c, rows, func(scan func(...any) error) (Feature, bool) {
		var desc, fecha, ruta, drive, geo string
		if scan(&desc, &fecha, &ruta, &drive, &geo) != nil {
			return Feature{}, false
		}
		return newFeature(geo, map[string]interface{}{
			"tipo": "fotografia", "descripcion": desc, "fecha": fecha,
			"ruta_archivo": ruta, "drive_id": drive,
		}), true
	})
}
