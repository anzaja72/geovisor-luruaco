package main

// Indicadores del componente de Restauración, calculados desde el censo forestal
// (eco_restauracion.arboles_monitoreo) y el análisis de coberturas. Sustituye los
// valores que el frontend tenía cableados en data.ts.

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
)

// GET /api/restauracion/indicadores?fecha=Linea base
func getIndicadoresRestauracion(c *fiber.Ctx) error {
	fecha := c.Query("fecha", "Linea base")
	ctx := c.UserContext()

	// 1) Indicadores base (vista) + Shannon
	var (
		riqueza, individuos, fustes, parcelas int
		densidad, areaBasal                   float64
		altura                                sql.NullFloat64
	)
	err := db.QueryRowContext(ctx, `
		SELECT riqueza, individuos, fustes, densidad_ha, area_basal_ha, altura_media, parcelas
		FROM eco_restauracion.vw_indicadores_restauracion WHERE fecha=$1`, fecha).
		Scan(&riqueza, &individuos, &fustes, &densidad, &areaBasal, &altura, &parcelas)
	if err == sql.ErrNoRows {
		return c.JSON(fiber.Map{"fecha": fecha, "sin_datos": true})
	}
	if err != nil {
		return serverError(c, "Error consultando indicadores", err)
	}

	var shannon float64
	_ = db.QueryRowContext(ctx, `
		SELECT COALESCE(-sum(p*ln(p)),0) FROM (
		  SELECT count(*)::float8 / NULLIF(sum(count(*)) OVER (),0) AS p
		  FROM eco_restauracion.arboles_monitoreo
		  WHERE fecha=$1 AND especie IS NOT NULL AND especie<>''
		  GROUP BY especie) t`, fecha).Scan(&shannon)

	// 2) Coberturas agregadas por clase + activa/pasiva
	coberturas := []fiber.Map{}
	rows, err := db.QueryContext(ctx, `
		SELECT descripcion, round(sum(area_hectareas)::numeric,2), round(sum(porcentaje)::numeric,2)
		FROM eco_restauracion.coberturas_vegetales
		GROUP BY descripcion ORDER BY 2 DESC`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d string
			var ha, pct float64
			if rows.Scan(&d, &ha, &pct) == nil {
				coberturas = append(coberturas, fiber.Map{"clase": d, "ha": ha, "pct": pct})
			}
		}
	}
	var activa, pasiva float64
	_ = db.QueryRowContext(ctx, `
		SELECT
		  COALESCE(sum(area_hectareas) FILTER (WHERE descripcion NOT ILIKE '%bosque%'),0),
		  COALESCE(sum(area_hectareas) FILTER (WHERE descripcion ILIKE '%bosque%'),0)
		FROM eco_restauracion.coberturas_vegetales`).Scan(&activa, &pasiva)

	// 3) Densidad / riqueza por parcela
	porParcela := []fiber.Map{}
	if rows, err := db.QueryContext(ctx, `
		SELECT id_parcela,
		       count(*) FILTER (WHERE especie IS NOT NULL AND especie<>'') AS ind,
		       count(DISTINCT especie) FILTER (WHERE especie IS NOT NULL AND especie<>'') AS riq
		FROM eco_restauracion.arboles_monitoreo WHERE fecha=$1
		GROUP BY id_parcela ORDER BY id_parcela`, fecha); err == nil {
		defer rows.Close()
		for rows.Next() {
			var cod string
			var ind, riq int
			if rows.Scan(&cod, &ind, &riq) == nil {
				porParcela = append(porParcela, fiber.Map{
					"codigo": cod, "individuos": ind, "riqueza": riq, "densidad_ha": ind * 10,
				})
			}
		}
	}

	// 4) Abundancia por especie (nombre común)
	abundancia := []fiber.Map{}
	if rows, err := db.QueryContext(ctx, `
		SELECT COALESCE(NULLIF(nombre_comun,''), especie) AS nom, count(*),
		       round(100.0*count(*)/NULLIF(sum(count(*)) OVER (),0),1)
		FROM eco_restauracion.arboles_monitoreo
		WHERE fecha=$1 AND especie IS NOT NULL AND especie<>''
		GROUP BY 1 ORDER BY 2 DESC`, fecha); err == nil {
		defer rows.Close()
		for rows.Next() {
			var nom string
			var n int
			var pct float64
			if rows.Scan(&nom, &n, &pct) == nil {
				abundancia = append(abundancia, fiber.Map{"nombre": nom, "n": n, "pct": pct})
			}
		}
	}

	return c.JSON(fiber.Map{
		"fecha":         fecha,
		"riqueza":       riqueza,
		"densidad_ha":   densidad,
		"area_basal_ha": areaBasal,
		"individuos":    individuos,
		"fustes":        fustes,
		"altura_media":  altura.Float64,
		"shannon":       round2(shannon),
		"activa_ha":     round2(activa),
		"pasiva_ha":     round2(pasiva),
		"area_total_ha": round2(activa + pasiva),
		"parcelas":      porParcela,
		"abundancia":    abundancia,
		"coberturas":    coberturas,
	})
}

func round2(f float64) float64 {
	return float64(int64(f*100+0.5)) / 100
}
