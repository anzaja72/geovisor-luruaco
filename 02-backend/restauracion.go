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
	cob := coberturaPattern(c.Query("cobertura", "")) // "" = todas; si no, patrón ILIKE
	ctx := c.UserContext()

	// 1) Indicadores base — replica vw_indicadores_restauracion con filtro opcional de
	//    cobertura ($2='' → todas; si no, arboles_monitoreo.cobertura ILIKE $2).
	var (
		riqueza, individuos, fustes, parcelas int
		densidad, areaBasal                   float64
		altura                                sql.NullFloat64
	)
	err := db.QueryRowContext(ctx, `
		WITH base AS (
		  SELECT count(*) FILTER (WHERE especie IS NOT NULL)                AS individuos,
		         count(DISTINCT especie) FILTER (WHERE especie IS NOT NULL) AS riqueza,
		         COALESCE(sum(n_fustes),0)                                  AS fustes,
		         COALESCE(sum(area_basal_arbol),0)                          AS area_basal_total,
		         avg(altura_max) FILTER (WHERE altura_max IS NOT NULL)      AS altura_media,
		         count(DISTINCT id_parcela)                                 AS parcelas
		  FROM eco_restauracion.arboles_monitoreo
		  WHERE fecha=$1 AND ($2='' OR cobertura ILIKE $2)
		)
		SELECT riqueza, individuos, fustes,
		       COALESCE(round((individuos / NULLIF(parcelas*0.1,0))::numeric,1),0),
		       COALESCE(round((area_basal_total / NULLIF(parcelas*0.1,0))::numeric,2),0),
		       round(altura_media::numeric,1), parcelas
		FROM base`, fecha, cob).
		Scan(&riqueza, &individuos, &fustes, &densidad, &areaBasal, &altura, &parcelas)
	if err != nil {
		return serverError(c, "Error consultando indicadores", err)
	}
	if parcelas == 0 { // no hay censo para esta fecha (o esta cobertura)
		return c.JSON(fiber.Map{"fecha": fecha, "sin_datos": true})
	}

	var shannon float64
	_ = db.QueryRowContext(ctx, `
		SELECT COALESCE(-sum(p*ln(p)),0) FROM (
		  SELECT count(*)::float8 / NULLIF(sum(count(*)) OVER (),0) AS p
		  FROM eco_restauracion.arboles_monitoreo
		  WHERE fecha=$1 AND ($2='' OR cobertura ILIKE $2) AND especie IS NOT NULL AND especie<>''
		  GROUP BY especie) t`, fecha, cob).Scan(&shannon)

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
		FROM eco_restauracion.arboles_monitoreo WHERE fecha=$1 AND ($2='' OR cobertura ILIKE $2)
		GROUP BY id_parcela ORDER BY id_parcela`, fecha, cob); err == nil {
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
		WHERE fecha=$1 AND ($2='' OR cobertura ILIKE $2) AND especie IS NOT NULL AND especie<>''
		GROUP BY 1 ORDER BY 2 DESC`, fecha, cob); err == nil {
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

// coberturaPattern traduce la clave del selector del frontend (ver claseCobertura en
// MapView.tsx) a un patrón ILIKE contra arboles_monitoreo.cobertura. "" = todas.
func coberturaPattern(key string) string {
	switch key {
	case "denso":
		return "%denso%"
	case "secundaria":
		return "%secundaria%"
	case "galeria":
		return "%galer%" // galería / galeria / ripario
	case "mosaico":
		return "%mosaico%" // mosaico de cultivos
	case "desnuda":
		return "%desnud%" // desnuda / degradada
	default:
		return "" // todas / clave desconocida → sin filtro
	}
}
