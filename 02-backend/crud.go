package main

// CRUD de monitoreos (Especificación §3 y §8) y cambio de contraseña.
// Lectura: cualquier autenticado · Crear/editar: administrador y técnico ·
// Eliminar: solo administrador.

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// crearPunto registra un punto/estación de observación por coordenadas GPS.
// POST /api/puntos  (administrador y técnico)
func crearPunto(c *fiber.Ctx) error {
	var b struct {
		Codigo      string  `json:"codigo_punto"`
		Nombre      string  `json:"nombre_punto"`
		Tipo        string  `json:"tipo_monitoreo"`
		Descripcion string  `json:"descripcion"`
		Longitud    float64 `json:"longitud"`
		Latitud     float64 `json:"latitud"`
	}
	if err := c.BodyParser(&b); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cuerpo inválido"})
	}
	if b.Latitud < -90 || b.Latitud > 90 || b.Longitud < -180 || b.Longitud > 180 ||
		(b.Latitud == 0 && b.Longitud == 0) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Coordenadas inválidas"})
	}
	if strings.TrimSpace(b.Tipo) == "" {
		b.Tipo = "observacion"
	}
	if strings.TrimSpace(b.Codigo) == "" {
		b.Codigo = fmt.Sprintf("OBS-%d", time.Now().Unix())
	}
	resp := ""
	if u, ok := c.Locals("user").(*Claims); ok {
		resp = u.Nombre
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.puntos_monitoreo
		    (codigo_punto, nombre_punto, descripcion, tipo_monitoreo, estado_punto,
		     longitud, latitud, geom, tecnico_responsable)
		VALUES ($1,$2,$3,$4,'activo',$5::float8,$6::float8,
		        ST_SetSRID(ST_MakePoint($5::float8,$6::float8),4326), $7)
		RETURNING id`,
		b.Codigo, nullIfEmpty(b.Nombre), nullIfEmpty(b.Descripcion), b.Tipo,
		b.Longitud, b.Latitud, nullIfEmpty(resp)).Scan(&id)
	if err != nil {
		return serverError(c, "Error al crear el punto", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id, "codigo_punto": b.Codigo})
}

type monitoreoBody struct {
	EstacionID    *int64   `json:"estacion_id"`
	ParcelaID     *int64   `json:"parcela_id"`
	Fecha         string   `json:"fecha"` // YYYY-MM-DD
	Indicador     string   `json:"indicador"`
	Valor         *float64 `json:"valor"`
	Unidad        string   `json:"unidad"`
	Responsable   string   `json:"responsable"`
	Observaciones string   `json:"observaciones"`
}

// GET /api/monitoreos?indicador=&desde=&hasta=&estacion_id=
func listarMonitoreos(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(), `
		SELECT m.id, COALESCE(m.estacion_id,0), COALESCE(pm.codigo_punto,''),
		       m.fecha::text, m.indicador, m.valor, COALESCE(m.unidad,''),
		       COALESCE(m.responsable,''), COALESCE(m.observaciones,'')
		FROM eco_restauracion.monitoreos m
		LEFT JOIN eco_restauracion.puntos_monitoreo pm ON pm.id = m.estacion_id
		WHERE ($1 = '' OR m.indicador ILIKE '%'||$1||'%')
		  AND ($2 = '' OR m.fecha >= $2::date)
		  AND ($3 = '' OR m.fecha <= $3::date)
		ORDER BY m.fecha DESC, m.id DESC
		LIMIT 500`,
		c.Query("indicador", ""), c.Query("desde", ""), c.Query("hasta", ""))
	if err != nil {
		return serverError(c, "Error al listar monitoreos", err)
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var (
			id, estID            int64
			codigo, fecha, ind   string
			unidad, resp, obs    string
			valor                sql.NullFloat64
		)
		if err := rows.Scan(&id, &estID, &codigo, &fecha, &ind, &valor, &unidad, &resp, &obs); err != nil {
			continue
		}
		m := fiber.Map{
			"id": id, "fecha": fecha, "indicador": ind,
			"unidad": unidad, "responsable": resp, "observaciones": obs,
		}
		if estID > 0 {
			m["estacion_id"] = estID
			m["estacion"] = codigo
		}
		if valor.Valid {
			m["valor"] = valor.Float64
		}
		out = append(out, m)
	}
	return c.JSON(fiber.Map{"monitoreos": out})
}

func validarMonitoreo(b *monitoreoBody) string {
	b.Indicador = strings.TrimSpace(b.Indicador)
	if b.Indicador == "" {
		return "El indicador es obligatorio"
	}
	if b.Fecha == "" {
		b.Fecha = time.Now().Format("2006-01-02")
	}
	if _, err := time.Parse("2006-01-02", b.Fecha); err != nil {
		return "Fecha inválida (formato AAAA-MM-DD)"
	}
	return ""
}

// POST /api/monitoreos
func crearMonitoreo(c *fiber.Ctx) error {
	var b monitoreoBody
	if err := c.BodyParser(&b); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cuerpo inválido"})
	}
	if msg := validarMonitoreo(&b); msg != "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": msg})
	}
	// Responsable por defecto: el usuario autenticado.
	if strings.TrimSpace(b.Responsable) == "" {
		if u, ok := c.Locals("user").(*Claims); ok {
			b.Responsable = u.Nombre
		}
	}
	var id int64
	err := db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.monitoreos
		    (estacion_id, parcela_id, fecha, indicador, valor, unidad, responsable, observaciones)
		VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8) RETURNING id`,
		b.EstacionID, b.ParcelaID, b.Fecha, b.Indicador, b.Valor,
		nullIfEmpty(b.Unidad), nullIfEmpty(b.Responsable), nullIfEmpty(b.Observaciones),
	).Scan(&id)
	if err != nil {
		return serverError(c, "Error al registrar monitoreo", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

// PUT /api/monitoreos/:id
func actualizarMonitoreo(c *fiber.Ctx) error {
	var b monitoreoBody
	if err := c.BodyParser(&b); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cuerpo inválido"})
	}
	if msg := validarMonitoreo(&b); msg != "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": msg})
	}
	res, err := db.ExecContext(c.UserContext(), `
		UPDATE eco_restauracion.monitoreos SET
		    estacion_id=$1, parcela_id=$2, fecha=$3::date, indicador=$4,
		    valor=$5, unidad=$6, responsable=$7, observaciones=$8
		WHERE id=$9`,
		b.EstacionID, b.ParcelaID, b.Fecha, b.Indicador, b.Valor,
		nullIfEmpty(b.Unidad), nullIfEmpty(b.Responsable), nullIfEmpty(b.Observaciones),
		c.Params("id"))
	if err != nil {
		return serverError(c, "Error al actualizar monitoreo", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Monitoreo no encontrado"})
	}
	return c.JSON(fiber.Map{"ok": true})
}

// DELETE /api/monitoreos/:id  (solo administrador)
func eliminarMonitoreo(c *fiber.Ctx) error {
	res, err := db.ExecContext(c.UserContext(),
		`DELETE FROM eco_restauracion.monitoreos WHERE id=$1`, c.Params("id"))
	if err != nil {
		return serverError(c, "Error al eliminar monitoreo", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Monitoreo no encontrado"})
	}
	return c.JSON(fiber.Map{"ok": true})
}

// PUT /api/auth/password — cambio de contraseña del propio usuario.
func cambiarPassword(c *fiber.Ctx) error {
	u := c.Locals("user").(*Claims)
	var b struct {
		Actual string `json:"actual"`
		Nueva  string `json:"nueva"`
	}
	if err := c.BodyParser(&b); err != nil || len(b.Nueva) < 8 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Se requieren 'actual' y 'nueva' (mínimo 8 caracteres)"})
	}
	var hash string
	if err := db.QueryRowContext(c.UserContext(),
		`SELECT password_hash FROM eco_restauracion.usuarios WHERE id=$1`, u.UserID,
	).Scan(&hash); err != nil {
		return serverError(c, "Error consultando usuario", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(b.Actual)) != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Contraseña actual incorrecta"})
	}
	nuevo, err := bcrypt.GenerateFromPassword([]byte(b.Nueva), bcrypt.DefaultCost)
	if err != nil {
		return serverError(c, "Error procesando contraseña", err)
	}
	if _, err := db.ExecContext(c.UserContext(),
		`UPDATE eco_restauracion.usuarios SET password_hash=$1 WHERE id=$2`,
		string(nuevo), u.UserID); err != nil {
		return serverError(c, "Error actualizando contraseña", err)
	}
	return c.JSON(fiber.Map{"ok": true})
}

func nullIfEmpty(s string) sql.NullString {
	s = strings.TrimSpace(s)
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}
