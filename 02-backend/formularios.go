package main

// Endpoints de escritura para el formulario "Registrar Monitoreo" con pestañas por
// componente. Cada handler inserta en la tabla del componente correspondiente.

import (
	"encoding/base64"
	"fmt"
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
	Campana    string   `json:"campana"` // 'Línea base', 'Muestreo 1'… agrupa la medición
	Punto      string   `json:"punto"`   // codigo_punto de puntos_monitoreo (FICO-1…FICO-5)
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
	b.Campana = strings.TrimSpace(b.Campana)
	if b.Campana == "" {
		return badReq(c, "La campaña es obligatoria (p. ej. «Muestreo 1»): el tablero agrupa por ella")
	}
	// El punto solo aplica a agua y sedimentos; la biota se reporta por campaña.
	var puntoID *int64
	if b.Punto = strings.TrimSpace(b.Punto); b.Punto != "" {
		var pid int64
		if err := db.QueryRowContext(c.UserContext(),
			`SELECT id FROM eco_restauracion.puntos_monitoreo WHERE codigo_punto = $1`, b.Punto,
		).Scan(&pid); err != nil {
			return badReq(c, "Punto de muestreo desconocido: "+b.Punto)
		}
		puntoID = &pid
	} else if b.Tipo != "biota" {
		return badReq(c, "El punto de muestreo es obligatorio (FICO-1…FICO-5)")
	}
	var id int64
	var err error
	switch b.Tipo {
	case "agua":
		if strings.TrimSpace(b.Variable) == "" {
			return badReq(c, "La variable es obligatoria")
		}
		err = db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.ficor_calidad_agua (punto_id, campana, fecha, variable, valor, unidad)
			VALUES ($1,$2,$3::date,$4,$5,$6) RETURNING id`,
			puntoID, b.Campana, b.Fecha, b.Variable, b.Valor, nullIfEmpty(b.Unidad)).Scan(&id)
	case "sedimento":
		if b.Categoria != "metal_pesado" && b.Categoria != "plaguicida" {
			return badReq(c, "Categoría inválida (metal_pesado | plaguicida)")
		}
		if strings.TrimSpace(b.Variable) == "" {
			return badReq(c, "La variable es obligatoria")
		}
		err = db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.ficor_calidad_sedimentos (punto_id, campana, fecha, categoria, variable, valor, unidad)
			VALUES ($1,$2,$3::date,$4,$5,$6,$7) RETURNING id`,
			puntoID, b.Campana, b.Fecha, b.Categoria, b.Variable, b.Valor, nullIfEmpty(b.Unidad)).Scan(&id)
	case "biota":
		if strings.TrimSpace(b.Grupo) == "" {
			return badReq(c, "El grupo de biota es obligatorio")
		}
		err = db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.ficor_biota (punto_id, campana, fecha, grupo, abundancia, riqueza)
			VALUES ($1,$2,$3::date,$4,$5,$6) RETURNING id`,
			puntoID, b.Campana, b.Fecha, b.Grupo, b.Abundancia, b.Riqueza).Scan(&id)
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
	// Fotografía opcional del avistamiento, como data URL
	// («data:image/jpeg;base64,…»). Se guarda en la base, no en disco.
	Foto       string `json:"foto"`
	FotoNombre string `json:"foto_nombre"`
}

// Tamaño máximo de una fotografía. Las imágenes viven en la base, así que cada
// una pesa también en los respaldos: 5 MB alcanza de sobra para una foto de
// campo y mantiene el volcado manejable.
const maxFotoBytes = 5 << 20

var mimesFoto = map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true}

// decodificarFoto convierte la data URL que manda el formulario en bytes,
// validando tipo y tamaño. Devuelve (nil, "", nil) si no venía foto.
func decodificarFoto(dataURL string) ([]byte, string, error) {
	dataURL = strings.TrimSpace(dataURL)
	if dataURL == "" {
		return nil, "", nil
	}
	coma := strings.Index(dataURL, ",")
	if !strings.HasPrefix(dataURL, "data:") || coma < 0 {
		return nil, "", fmt.Errorf("la imagen debe venir como data URL")
	}
	cabecera := dataURL[5:coma]
	mime := strings.TrimSuffix(cabecera, ";base64")
	if mime == cabecera {
		return nil, "", fmt.Errorf("la imagen debe venir codificada en base64")
	}
	if !mimesFoto[mime] {
		return nil, "", fmt.Errorf("formato no admitido (%s): usa JPG, PNG o WebP", mime)
	}
	datos, err := base64.StdEncoding.DecodeString(dataURL[coma+1:])
	if err != nil {
		return nil, "", fmt.Errorf("la imagen no se pudo decodificar")
	}
	if len(datos) > maxFotoBytes {
		return nil, "", fmt.Errorf("la imagen pesa %.1f MB; el máximo es %d MB",
			float64(len(datos))/(1<<20), maxFotoBytes>>20)
	}
	return datos, mime, nil
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

	// La foto se guarda aparte, ligada a la observación. Si falla, la
	// observación ya quedó registrada: se informa el problema de la foto sin
	// perder el dato de campo, que es lo caro de volver a tomar.
	imagen, mime, errFoto := decodificarFoto(b.Foto)
	if errFoto != nil {
		return c.Status(http.StatusCreated).JSON(fiber.Map{
			"id": id, "aviso": "La observación se guardó, pero la foto no: " + errFoto.Error(),
		})
	}
	var fotoID int64
	if imagen != nil {
		if e := db.QueryRowContext(c.UserContext(), `
			INSERT INTO eco_restauracion.fotografias
			  (observacion_id, imagen, mime, nombre_archivo, tamano_bytes, descripcion, fecha)
			VALUES ($1,$2,$3,$4,$5,$6,$7::date) RETURNING id`,
			id, imagen, mime, nullIfEmpty(b.FotoNombre), len(imagen),
			nullIfEmpty(strings.TrimSpace(b.NombreComun+" "+b.NombreCientifico)), fecha,
		).Scan(&fotoID); e != nil {
			return c.Status(http.StatusCreated).JSON(fiber.Map{
				"id": id, "aviso": "La observación se guardó, pero la foto no se pudo almacenar",
			})
		}
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id, "foto_id": fotoID})
}

// GET /api/fauna/observaciones
func listarFaunaObservaciones(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT o.id, COALESCE(o.grupo,''), COALESCE(o.nombre_comun,''), COALESCE(o.nombre_cientifico,''),
		       COALESCE(o.cobertura_vegetal,''), COALESCE(o.n_individuos,0),
		       COALESCE(o.lugar_percha,''), COALESCE(o.habito,''), COALESCE(o.comportamiento,''),
		       COALESCE(o.fecha::text,''), COALESCE(o.hora,''), COALESCE(o.observacion,''),
		       COALESCE((SELECT f.id FROM eco_restauracion.fotografias f
		                  WHERE f.observacion_id = o.id AND f.imagen IS NOT NULL
		                  ORDER BY f.id DESC LIMIT 1), 0)
		FROM eco_restauracion.fauna_observaciones o
		ORDER BY o.grupo, o.nombre_cientifico, o.id DESC LIMIT 2000`)
	if err != nil {
		return serverError(c, "Error al listar observaciones de fauna", err)
	}
	defer rows.Close()
	out := []fiber.Map{}
	for rows.Next() {
		var id, n, fotoID int64
		var gr, nc, ns, cv, lp, hb, cp, fe, ho, ob string
		if rows.Scan(&id, &gr, &nc, &ns, &cv, &n, &lp, &hb, &cp, &fe, &ho, &ob, &fotoID) != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "grupo": gr, "nombre_comun": nc, "nombre_cientifico": ns, "cobertura_vegetal": cv,
			"n_individuos": n, "lugar_percha": lp, "habito": hb, "comportamiento": cp,
			"fecha": fe, "hora": ho, "observacion": ob, "foto_id": fotoID,
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

// GET /api/fotografias/:id/imagen
// Devuelve el binario de una fotografía guardada en la base. Va con caché larga
// porque una foto de campo no cambia: si se reemplaza, cambia el id.
func getFotografiaImagen(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return badReq(c, "Identificador de fotografía inválido")
	}
	var imagen []byte
	var mime string
	err = db.QueryRowContext(c.UserContext(), `
		SELECT imagen, COALESCE(mime,'image/jpeg')
		FROM eco_restauracion.fotografias
		WHERE id = $1 AND imagen IS NOT NULL`, id).Scan(&imagen, &mime)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Fotografía no encontrada"})
	}
	c.Set("Content-Type", mime)
	c.Set("Cache-Control", "private, max-age=86400")
	return c.Send(imagen)
}
