package main

// Registro público de cuentas de consulta.
//
// Cualquier persona puede crearse una cuenta para consultar la plataforma. El rol
// se fija aquí en 'consulta' y no se lee del cuerpo de la petición: aunque alguien
// envíe "rol":"administrador", la cuenta se crea igualmente como consulta. Los
// roles de técnico y administrador solo los asigna un administrador desde la
// pantalla de administración.

import (
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

const (
	registrosPorHora = 5 // por dirección IP
	minPassword      = 8
)

var correoValido = regexp.MustCompile(`^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$`)

// altas lleva la cuenta de registros recientes por IP, para que nadie pueda dar de
// alta cuentas de forma masiva.
type registroIP struct {
	mu    sync.Mutex
	visto map[string][]time.Time
}

var altas = registroIP{visto: map[string][]time.Time{}}

func (r *registroIP) permite(ip string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	corte := time.Now().Add(-time.Hour)
	recientes := r.visto[ip][:0]
	for _, t := range r.visto[ip] {
		if t.After(corte) {
			recientes = append(recientes, t)
		}
	}
	if len(recientes) >= registrosPorHora {
		r.visto[ip] = recientes
		return false
	}
	r.visto[ip] = append(recientes, time.Now())
	return true
}

// POST /api/auth/registro — público
func registroPublico(c *fiber.Ctx) error {
	var body struct {
		Nombre   string `json:"nombre"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return badReq(c, "Cuerpo inválido")
	}

	body.Nombre = strings.TrimSpace(body.Nombre)
	body.Email = strings.ToLower(strings.TrimSpace(body.Email))

	if body.Nombre == "" {
		return badReq(c, "El nombre es obligatorio")
	}
	if !correoValido.MatchString(body.Email) {
		return badReq(c, "El correo electrónico no es válido")
	}
	if len([]rune(body.Password)) < minPassword {
		return badReq(c, "La contraseña debe tener al menos 8 caracteres")
	}

	if !altas.permite(c.IP()) {
		return c.Status(http.StatusTooManyRequests).JSON(fiber.Map{
			"error": "Se alcanzó el límite de cuentas creadas desde esta conexión; intente más tarde."})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return serverError(c, "Error procesando la contraseña", err)
	}

	// El rol va escrito en la consulta, no viene del cliente.
	var id int64
	err = db.QueryRowContext(c.UserContext(), `
		INSERT INTO eco_restauracion.usuarios (nombre, email, password_hash, rol, origen)
		VALUES ($1, lower($2), $3, 'consulta', 'registro_publico') RETURNING id`,
		body.Nombre, body.Email, string(hash)).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return c.Status(http.StatusConflict).JSON(fiber.Map{
				"error": "Ese correo ya tiene una cuenta. Inicie sesión o use otro correo."})
		}
		return serverError(c, "Error al crear la cuenta", err)
	}

	// Se devuelve la sesión iniciada: quien se registra entra directamente.
	token, err := generarToken(id, body.Email, body.Nombre, "consulta")
	if err != nil {
		return serverError(c, "Cuenta creada, pero no se pudo iniciar sesión", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"token": token,
		"usuario": fiber.Map{"id": id, "nombre": body.Nombre, "email": body.Email, "rol": "consulta"},
	})
}
