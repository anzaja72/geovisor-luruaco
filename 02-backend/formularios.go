package main

// Endpoints de escritura para el formulario "Registrar Monitoreo" con pestañas por
// componente. Cada handler inserta en la tabla del componente correspondiente.

import (
	"math"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func badReq(c *fiber.Ctx, msg string) error {
	return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": msg})
}

// ------------------------------------------------------------------
// Restauración → eco_restauracion.arboles_monitoreo (un individuo del censo)
// ------------------------------------------------------------------
type arbolBody struct {
	Fecha          string   `json:"fecha"`
	IdParcela      string   `json:"id_parcela"`
	Cobertura      string   `json:"cobertura"`
	Especie        string   `json:"especie"`
	NombreComun    string   `json:"nombre_comun"`
	AlturaMax      *float64 `json:"altura_max"`
	NFustes        *int     `json:"n_fustes"`
	DapEq          *float64 `json:"dap_eq"`
	CategoriaArbol string   `json:"categoria_arbol"`
}

func crearArbol(c *fiber.Ctx) error {
	var b arbolBody
	if err := c.BodyParser(&b); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	b.Fecha = strings.TrimSpace(b.Fecha)
	b.IdParcela = strings.TrimSpace(b.IdParcela)
	if b.Fecha == "" || b.IdParcela == "" {
		return badReq(c, "Fecha/monitoreo y parcela son obligatorios")
	}
	var areaBasal *float64
	if b.DapEq != nil { // área basal = π·(DAP/200)²  (m²)
		v := math.Pi * math.Pow(*b.DapEq/200, 2)
		areaBasal = &v
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.arboles_monitoreo
		  (fecha, cobertura, id_parcela, especie, nombre_comun, altura_max,
		   n_fustes, dap_eq, area_basal_arbol, categoria_arbol)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
		b.Fecha, nullIfEmpty(b.Cobertura), b.IdParcela, nullIfEmpty(b.Especie),
		nullIfEmpty(b.NombreComun), b.AlturaMax, b.NFustes, b.DapEq, areaBasal,
		nullIfEmpty(b.CategoriaArbol),
	).Scan(&id)
	if err != nil {
		return serverError(c, "Error al registrar árbol", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

// ------------------------------------------------------------------
// Fauna → eco_restauracion.fauna_grupos_resumen (upsert por fecha+grupo)
// ------------------------------------------------------------------
type faunaBody struct {
	Fecha      string `json:"fecha"`
	Grupo      string `json:"grupo"`
	Abundancia *int   `json:"abundancia"`
	Riqueza    *int   `json:"riqueza"`
}

func crearFaunaGrupo(c *fiber.Ctx) error {
	var b faunaBody
	if err := c.BodyParser(&b); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	b.Fecha = strings.TrimSpace(b.Fecha)
	b.Grupo = strings.TrimSpace(b.Grupo)
	if b.Fecha == "" || b.Grupo == "" {
		return badReq(c, "Fecha y grupo son obligatorios")
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.fauna_grupos_resumen (fecha, grupo, abundancia, riqueza)
		VALUES ($1,$2,$3,$4)
		ON CONFLICT (fecha, grupo) DO UPDATE
		  SET abundancia = EXCLUDED.abundancia, riqueza = EXCLUDED.riqueza
		RETURNING id`,
		b.Fecha, b.Grupo, b.Abundancia, b.Riqueza,
	).Scan(&id)
	if err != nil {
		return serverError(c, "Error al registrar fauna (¿grupo válido?)", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

// ------------------------------------------------------------------
// Ficorremediación → agua | sedimento | biota (según `tipo`)
// ------------------------------------------------------------------
type ficorBody struct {
	Tipo       string   `json:"tipo"` // agua | sedimento | biota
	Fecha      string   `json:"fecha"`
	Variable   string   `json:"variable"`
	Categoria  string   `json:"categoria"` // sedimento: metal_pesado | plaguicida
	Grupo      string   `json:"grupo"`     // biota
	Valor      *float64 `json:"valor"`
	Unidad     string   `json:"unidad"`
	Abundancia *int     `json:"abundancia"`
	Riqueza    *int     `json:"riqueza"`
}

func crearFicorMedicion(c *fiber.Ctx) error {
	var b ficorBody
	if err := c.BodyParser(&b); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	b.Fecha = strings.TrimSpace(b.Fecha)
	if b.Fecha == "" {
		return badReq(c, "La fecha es obligatoria (AAAA-MM-DD)")
	}
	var id int64
	var err error
	switch b.Tipo {
	case "agua":
		if strings.TrimSpace(b.Variable) == "" {
			return badReq(c, "La variable es obligatoria")
		}
		err = db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.ficor_calidad_agua (fecha, variable, valor, unidad)
			VALUES ($1::date,$2,$3,$4) RETURNING id`,
			b.Fecha, b.Variable, b.Valor, nullIfEmpty(b.Unidad)).Scan(&id)
	case "sedimento":
		if b.Categoria != "metal_pesado" && b.Categoria != "plaguicida" {
			return badReq(c, "Categoría inválida (metal_pesado | plaguicida)")
		}
		if strings.TrimSpace(b.Variable) == "" {
			return badReq(c, "La variable es obligatoria")
		}
		err = db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.ficor_calidad_sedimentos (fecha, categoria, variable, valor, unidad)
			VALUES ($1::date,$2,$3,$4,$5) RETURNING id`,
			b.Fecha, b.Categoria, b.Variable, b.Valor, nullIfEmpty(b.Unidad)).Scan(&id)
	case "biota":
		if strings.TrimSpace(b.Grupo) == "" {
			return badReq(c, "El grupo de biota es obligatorio")
		}
		err = db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.ficor_biota (fecha, grupo, abundancia, riqueza)
			VALUES ($1::date,$2,$3,$4) RETURNING id`,
			b.Fecha, b.Grupo, b.Abundancia, b.Riqueza).Scan(&id)
	default:
		return badReq(c, "Tipo inválido (agua | sedimento | biota)")
	}
	if err != nil {
		return serverError(c, "Error al registrar medición de ficorremediación", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

// ------------------------------------------------------------------
// Gobernanza → eco_restauracion.gobernanza_actividades
// ------------------------------------------------------------------
type gobernanzaBody struct {
	Actividad     string `json:"actividad"`
	Cantidad      int    `json:"cantidad"`
	Participantes int    `json:"participantes"`
	Ubicacion     string `json:"ubicacion"`
	Fecha         string `json:"fecha"`
}

func crearGobernanza(c *fiber.Ctx) error {
	var b gobernanzaBody
	if err := c.BodyParser(&b); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	b.Actividad = strings.TrimSpace(b.Actividad)
	if b.Actividad == "" {
		return badReq(c, "La actividad es obligatoria")
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.gobernanza_actividades
		  (actividad, cantidad, participantes, ubicacion, fecha)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		b.Actividad, b.Cantidad, b.Participantes, nullIfEmpty(b.Ubicacion), nullIfEmpty(b.Fecha),
	).Scan(&id)
	if err != nil {
		return serverError(c, "Error al registrar actividad de gobernanza", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

// ------------------------------------------------------------------
// Fauna → eco_restauracion.fauna_observaciones (un avistamiento por registro)
// ------------------------------------------------------------------
type faunaObsBody struct {
	Grupo            string `json:"grupo"`
	NombreComun      string `json:"nombre_comun"`
	NombreCientifico string `json:"nombre_cientifico"`
	CoberturaVegetal string `json:"cobertura_vegetal"`
	NIndividuos      *int   `json:"n_individuos"`
	LugarPercha      string `json:"lugar_percha"`
	Habito           string `json:"habito"`
	Comportamiento   string `json:"comportamiento"`
	Fecha            string `json:"fecha"`
	Hora             string `json:"hora"`
	Observacion      string `json:"observacion"`
}

func crearFaunaObservacion(c *fiber.Ctx) error {
	var b faunaObsBody
	if err := c.BodyParser(&b); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	if strings.TrimSpace(b.NombreComun) == "" && strings.TrimSpace(b.NombreCientifico) == "" {
		return badReq(c, "Indica al menos el nombre común o el científico")
	}
	var fecha interface{}
	if strings.TrimSpace(b.Fecha) != "" {
		fecha = b.Fecha
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.fauna_observaciones
		  (grupo, nombre_comun, nombre_cientifico, cobertura_vegetal, n_individuos, lugar_percha,
		   habito, comportamiento, fecha, hora, observacion)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,$10,$11) RETURNING id`,
		nullIfEmpty(b.Grupo), nullIfEmpty(b.NombreComun), nullIfEmpty(b.NombreCientifico),
		nullIfEmpty(b.CoberturaVegetal), b.NIndividuos, nullIfEmpty(b.LugarPercha),
		nullIfEmpty(b.Habito), nullIfEmpty(b.Comportamiento), fecha, nullIfEmpty(b.Hora),
		nullIfEmpty(b.Observacion),
	).Scan(&id)
	if err != nil {
		return serverError(c, "Error al registrar observación de fauna", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

// GET /api/fauna/observaciones
func listarFaunaObservaciones(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT id, COALESCE(grupo,''), COALESCE(nombre_comun,''), COALESCE(nombre_cientifico,''),
		       COALESCE(cobertura_vegetal,''), COALESCE(n_individuos,0),
		       COALESCE(lugar_percha,''), COALESCE(habito,''), COALESCE(comportamiento,''),
		       COALESCE(fecha::text,''), COALESCE(hora,''), COALESCE(observacion,'')
		FROM eco_restauracion.fauna_observaciones
		ORDER BY grupo, nombre_cientifico, id DESC LIMIT 2000`)
	if err != nil {
		return serverError(c, "Error al listar observaciones de fauna", err)
	}
	defer rows.Close()
	out := []fiber.Map{}
	for rows.Next() {
		var id, n int64
		var gr, nc, ns, cv, lp, hb, cp, fe, ho, ob string
		if rows.Scan(&id, &gr, &nc, &ns, &cv, &n, &lp, &hb, &cp, &fe, &ho, &ob) != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "grupo": gr, "nombre_comun": nc, "nombre_cientifico": ns, "cobertura_vegetal": cv,
			"n_individuos": n, "lugar_percha": lp, "habito": hb, "comportamiento": cp,
			"fecha": fe, "hora": ho, "observacion": ob,
		})
	}
	return c.JSON(out)
}

// ------------------------------------------------------------------
// Vegetación Acuática → eco_restauracion.maleza_limpieza (migración 12)
// ------------------------------------------------------------------
type malezaBody struct {
	Fecha         string   `json:"fecha"`
	AreaHa        *float64 `json:"area_ha"`
	BordeKm       *float64 `json:"borde_km"`
	Observaciones string   `json:"observaciones"`
}

func crearMalezaLimpieza(c *fiber.Ctx) error {
	var b malezaBody
	if err := c.BodyParser(&b); err != nil {
		return badReq(c, "Cuerpo inválido")
	}
	b.Fecha = strings.TrimSpace(b.Fecha)
	if b.Fecha == "" {
		return badReq(c, "La fecha/monitoreo es obligatoria")
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.maleza_limpieza (fecha, area_ha, borde_km, observaciones)
		VALUES ($1,$2,$3,$4) RETURNING id`,
		b.Fecha, b.AreaHa, b.BordeKm, nullIfEmpty(b.Observaciones),
	).Scan(&id)
	if err != nil {
		return serverError(c, "Error al registrar limpieza de maleza", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}
