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

	// Cada fila lleva su campaña y su punto: el tablero del ICA agrupa por ambos.
	// `es_demostracion` distingue la siembra de prueba de los resultados del
	// laboratorio, para que la pantalla lo advierta sin que nadie tenga que saberlo.
	agua := []fiber.Map{}
	sed := []fiber.Map{}
	biota := []fiber.Map{}
	fallo := false

	if rows, err := db.QueryContext(ctx, `
		SELECT COALESCE(a.campana,''), COALESCE(p.codigo_punto,''), a.fecha::text,
		       a.variable, a.valor, COALESCE(a.unidad,''), a.es_demostracion
		  FROM eco_restauracion.ficor_calidad_agua a
		  LEFT JOIN eco_restauracion.puntos_monitoreo p ON p.id = a.punto_id
		 ORDER BY a.fecha, p.codigo_punto, a.variable`); err != nil {
		fallo = true
	} else {
		defer rows.Close()
		for rows.Next() {
			var campana, punto, fecha, variable, unidad string
			var valor sql.NullFloat64
			var demo bool
			if rows.Scan(&campana, &punto, &fecha, &variable, &valor, &unidad, &demo) != nil {
				continue
			}
			agua = append(agua, fiber.Map{
				"campana": campana, "punto": punto, "fecha": fecha, "variable": variable,
				"valor": valor.Float64, "unidad": unidad, "sin_valor": !valor.Valid,
				"es_demostracion": demo,
			})
		}
	}

	if rows, err := db.QueryContext(ctx, `
		SELECT COALESCE(s.campana,''), COALESCE(p.codigo_punto,''), s.fecha::text,
		       s.categoria, s.variable, s.valor, COALESCE(s.unidad,''), s.es_demostracion
		  FROM eco_restauracion.ficor_calidad_sedimentos s
		  LEFT JOIN eco_restauracion.puntos_monitoreo p ON p.id = s.punto_id
		 ORDER BY s.fecha, s.categoria, s.variable, p.codigo_punto`); err != nil {
		fallo = true
	} else {
		defer rows.Close()
		for rows.Next() {
			var campana, punto, fecha, categoria, variable, unidad string
			var valor sql.NullFloat64
			var demo bool
			if rows.Scan(&campana, &punto, &fecha, &categoria, &variable, &valor, &unidad, &demo) != nil {
				continue
			}
			sed = append(sed, fiber.Map{
				"campana": campana, "punto": punto, "fecha": fecha, "categoria": categoria,
				"variable": variable, "valor": valor.Float64, "unidad": unidad,
				"sin_valor": !valor.Valid, "es_demostracion": demo,
			})
		}
	}

	if rows, err := db.QueryContext(ctx, `
		SELECT COALESCE(campana,''), fecha::text, grupo, abundancia, riqueza, es_demostracion
		  FROM eco_restauracion.ficor_biota ORDER BY fecha, grupo`); err != nil {
		fallo = true
	} else {
		defer rows.Close()
		for rows.Next() {
			var campana, fecha, grupo string
			var abundancia, riqueza sql.NullInt64
			var demo bool
			if rows.Scan(&campana, &fecha, &grupo, &abundancia, &riqueza, &demo) != nil {
				continue
			}
			biota = append(biota, fiber.Map{
				"campana": campana, "fecha": fecha, "grupo": grupo,
				"abundancia": abundancia.Int64, "riqueza": riqueza.Int64,
				"es_demostracion": demo,
			})
		}
	}

	if fallo && len(agua)+len(sed)+len(biota) == 0 {
		return serverError(c, "Error al consultar ficorremediación", nil)
	}
	return c.JSON(fiber.Map{
		"agua": agua, "sedimentos": sed, "biota": biota,
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
