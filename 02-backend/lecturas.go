package main

// Lecturas de los componentes que hasta ahora solo tenían escritura.
//
// Los formularios de gobernanza, vegetación acuática y ficorremediación
// guardaban en la geodatabase, pero no existía forma de leer lo guardado: las
// vistas mostraban constantes del frontend, de modo que lo registrado en campo
// no llegaba nunca a la pantalla. Estos endpoints cierran ese circuito.

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
)

// GET /api/gobernanza/actividades
// Actividades de gobernanza con sus eventos y participantes.
func getGobernanza(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT actividad, COALESCE(SUM(cantidad),0), COALESCE(SUM(participantes),0),
		       COALESCE(MAX(ubicacion),'')
		FROM eco_restauracion.gobernanza_actividades
		GROUP BY actividad
		ORDER BY SUM(participantes) DESC`)
	if err != nil {
		return serverError(c, "Error al consultar gobernanza", err)
	}
	defer rows.Close()

	actividades := []fiber.Map{}
	totalEventos, totalParticipantes := 0, 0
	for rows.Next() {
		var actividad, ubicacion string
		var cantidad, participantes int
		if rows.Scan(&actividad, &cantidad, &participantes, &ubicacion) != nil {
			continue
		}
		totalEventos += cantidad
		totalParticipantes += participantes
		actividades = append(actividades, fiber.Map{
			"actividad": actividad, "cantidad": cantidad,
			"participantes": participantes, "ubicacion": ubicacion,
		})
	}
	return c.JSON(fiber.Map{
		"actividades": actividades,
		"eventos":     totalEventos,
		"participantes": totalParticipantes,
		"tipos":       len(actividades),
	})
}

// GET /api/maleza/limpiezas
// Jornadas de limpieza de vegetación acuática, en orden cronológico de captura.
// `acumulado` es el mayor valor reportado: el campo area_ha se registra como
// acumulado por campaña, no como incremento.
func getMalezaLimpiezas(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT fecha, COALESCE(area_ha,0), COALESCE(borde_km,0), COALESCE(observaciones,'')
		FROM eco_restauracion.maleza_limpieza
		ORDER BY id`)
	if err != nil {
		return serverError(c, "Error al consultar limpiezas", err)
	}
	defer rows.Close()

	jornadas := []fiber.Map{}
	var acumulado, borde float64
	for rows.Next() {
		var fecha, obs string
		var area, km float64
		if rows.Scan(&fecha, &area, &km, &obs) != nil {
			continue
		}
		if area > acumulado {
			acumulado = area
		}
		if km > borde {
			borde = km
		}
		jornadas = append(jornadas, fiber.Map{
			"fecha": fecha, "area_ha": area, "borde_km": km, "observaciones": obs,
		})
	}
	return c.JSON(fiber.Map{
		"jornadas": jornadas, "acumulado_ha": acumulado, "borde_km": borde,
	})
}

// GET /api/ficor/mediciones
// Calidad de agua, calidad de sedimentos y biota del componente de
// ficorremediación. Devuelve las tres colecciones aunque estén vacías, para que
// la vista distinga «sin datos aún» de «error de consulta».
func getFicorMediciones(c *fiber.Ctx) error {
	ctx := c.UserContext()

	leer := func(q string, campos int) []fiber.Map {
		rows, err := db.QueryContext(ctx, q)
		if err != nil {
			return nil
		}
		defer rows.Close()
		out := []fiber.Map{}
		for rows.Next() {
			var fecha, a, b sql.NullString
			var valor sql.NullFloat64
			var n1, n2 sql.NullInt64
			switch campos {
			case 4: // agua: fecha, variable, valor, unidad
				if rows.Scan(&fecha, &a, &valor, &b) != nil {
					continue
				}
				out = append(out, fiber.Map{
					"fecha": fecha.String, "variable": a.String,
					"valor": valor.Float64, "unidad": b.String, "sin_valor": !valor.Valid,
				})
			case 5: // sedimentos: fecha, categoria, variable, valor, unidad
				var cat sql.NullString
				if rows.Scan(&fecha, &cat, &a, &valor, &b) != nil {
					continue
				}
				out = append(out, fiber.Map{
					"fecha": fecha.String, "categoria": cat.String, "variable": a.String,
					"valor": valor.Float64, "unidad": b.String, "sin_valor": !valor.Valid,
				})
			default: // biota: fecha, grupo, abundancia, riqueza
				if rows.Scan(&fecha, &a, &n1, &n2) != nil {
					continue
				}
				out = append(out, fiber.Map{
					"fecha": fecha.String, "grupo": a.String,
					"abundancia": n1.Int64, "riqueza": n2.Int64,
				})
			}
		}
		return out
	}

	agua := leer(`SELECT fecha::text, variable, valor, COALESCE(unidad,'')
	              FROM eco_restauracion.ficor_calidad_agua ORDER BY fecha, variable`, 4)
	sed := leer(`SELECT fecha::text, categoria, variable, valor, COALESCE(unidad,'')
	             FROM eco_restauracion.ficor_calidad_sedimentos ORDER BY fecha, categoria, variable`, 5)
	biota := leer(`SELECT fecha::text, grupo, abundancia, riqueza
	               FROM eco_restauracion.ficor_biota ORDER BY fecha, grupo`, 3)

	if agua == nil && sed == nil && biota == nil {
		return serverError(c, "Error al consultar ficorremediación", nil)
	}
	vacio := func(m []fiber.Map) []fiber.Map {
		if m == nil {
			return []fiber.Map{}
		}
		return m
	}
	return c.JSON(fiber.Map{
		"agua": vacio(agua), "sedimentos": vacio(sed), "biota": vacio(biota),
		"sin_datos": len(agua)+len(sed)+len(biota) == 0,
	})
}

// GET /api/fauna/grupos
// Abundancia y riqueza por grupo taxonómico y campaña.
func getFaunaGrupos(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT fecha, grupo, COALESCE(abundancia,0), COALESCE(riqueza,0)
		FROM eco_restauracion.fauna_grupos_resumen
		ORDER BY fecha, grupo`)
	if err != nil {
		return serverError(c, "Error al consultar grupos de fauna", err)
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var fecha, grupo string
		var abundancia, riqueza int
		if rows.Scan(&fecha, &grupo, &abundancia, &riqueza) != nil {
			continue
		}
		out = append(out, fiber.Map{
			"fecha": fecha, "grupo": grupo,
			"abundancia": abundancia, "riqueza": riqueza,
		})
	}
	return c.JSON(fiber.Map{"grupos": out})
}
