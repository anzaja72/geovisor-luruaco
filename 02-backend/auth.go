package main

// Autenticación y autorización (Especificación §8).
// Roles: administrador (control total) | tecnico (carga/edición) | consulta (lectura).

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte

const tokenTTL = 24 * time.Hour

type Claims struct {
	UserID int64  `json:"uid"`
	Email  string `json:"email"`
	Nombre string `json:"nombre"`
	Rol    string `json:"rol"`
	jwt.RegisteredClaims
}

// initAuth configura el secreto JWT y siembra el administrador inicial.
func initAuth() {
	secret := getEnv("JWT_SECRET", "")
	if secret == "" {
		// Generar uno efímero (los tokens no sobreviven reinicios). Configurar en prod.
		b := make([]byte, 32)
		_, _ = rand.Read(b)
		secret = hex.EncodeToString(b)
		log.Println("⚠️  JWT_SECRET no definido; usando secreto efímero (definirlo en producción).")
	}
	jwtSecret = []byte(secret)
	ensureAdmin()
}

// ensureAdmin crea el usuario administrador inicial si no existe ninguno.
func ensureAdmin() {
	var n int
	if err := db.QueryRow(
		`SELECT COUNT(*) FROM eco_restauracion.usuarios WHERE rol = 'administrador'`,
	).Scan(&n); err != nil {
		log.Printf("ensureAdmin: %v", err)
		return
	}
	if n > 0 {
		return
	}
	email := getEnv("ADMIN_EMAIL", "admin@luruaco.local")
	pass := getEnv("ADMIN_PASSWORD", "")
	if pass == "" {
		b := make([]byte, 9)
		_, _ = rand.Read(b)
		pass = hex.EncodeToString(b)
		log.Printf("🔑 Admin inicial creado — email: %s  password: %s (cámbiala; define ADMIN_PASSWORD para fijarla)", email, pass)
	} else {
		log.Printf("🔑 Admin inicial creado — email: %s (password de ADMIN_PASSWORD)", email)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("ensureAdmin hash: %v", err)
		return
	}
	_, err = db.Exec(
		`INSERT INTO eco_restauracion.usuarios (nombre, email, password_hash, rol)
		 VALUES ('Administrador', $1, $2, 'administrador')`, email, string(hash))
	if err != nil {
		log.Printf("ensureAdmin insert: %v", err)
	}
}

func generarToken(id int64, email, nombre, rol string) (string, error) {
	claims := Claims{
		UserID: id, Email: email, Nombre: nombre, Rol: rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "luruaco-api",
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret)
}

// requireAuth valida el JWT y, si se indican roles, exige pertenencia.
// requireAuth() = cualquier usuario autenticado.
func requireAuth(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		h := c.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Token requerido"})
		}
		tokenStr := strings.TrimPrefix(h, "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err != nil || !token.Valid {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido o expirado"})
		}
		if len(roles) > 0 {
			ok := false
			for _, r := range roles {
				if claims.Rol == r {
					ok = true
					break
				}
			}
			if !ok {
				return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "Rol sin permiso para esta operación"})
			}
		}
		c.Locals("user", claims)
		return c.Next()
	}
}

// ---------- Handlers ----------

func login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil || body.Email == "" || body.Password == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "email y password requeridos"})
	}
	var (
		id     int64
		nombre, hash, rol string
		activo bool
	)
	err := db.QueryRowContext(c.UserContext(),
		`SELECT id, nombre, password_hash, rol, activo
		 FROM eco_restauracion.usuarios WHERE lower(email) = lower($1)`, body.Email,
	).Scan(&id, &nombre, &hash, &rol, &activo)
	if err == sql.ErrNoRows || (err == nil && !activo) {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Credenciales inválidas"})
	}
	if err != nil {
		return serverError(c, "Error de autenticación", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password)) != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Credenciales inválidas"})
	}
	token, err := generarToken(id, body.Email, nombre, rol)
	if err != nil {
		return serverError(c, "Error generando token", err)
	}
	_, _ = db.Exec(`UPDATE eco_restauracion.usuarios SET ultimo_acceso = NOW() WHERE id = $1`, id)
	return c.JSON(fiber.Map{
		"token": token,
		"usuario": fiber.Map{"id": id, "nombre": nombre, "email": body.Email, "rol": rol},
	})
}

func me(c *fiber.Ctx) error {
	u := c.Locals("user").(*Claims)
	return c.JSON(fiber.Map{"id": u.UserID, "nombre": u.Nombre, "email": u.Email, "rol": u.Rol})
}

// ---------- Gestión de usuarios (solo administrador) ----------

func listarUsuarios(c *fiber.Ctx) error {
	rows, err := db.QueryContext(c.UserContext(),
		`SELECT id, nombre, email, rol, activo, creado_en, ultimo_acceso
		 FROM eco_restauracion.usuarios ORDER BY id`)
	if err != nil {
		return serverError(c, "Error al listar usuarios", err)
	}
	defer rows.Close()
	out := []fiber.Map{}
	for rows.Next() {
		var (
			id            int64
			nombre, email, rol string
			activo        bool
			creado        time.Time
			ultimo        sql.NullTime
		)
		if err := rows.Scan(&id, &nombre, &email, &rol, &activo, &creado, &ultimo); err != nil {
			continue
		}
		m := fiber.Map{"id": id, "nombre": nombre, "email": email, "rol": rol,
			"activo": activo, "creado_en": creado.Format("2006-01-02")}
		if ultimo.Valid {
			m["ultimo_acceso"] = ultimo.Time.Format(time.RFC3339)
		}
		out = append(out, m)
	}
	return c.JSON(fiber.Map{"usuarios": out})
}

func crearUsuario(c *fiber.Ctx) error {
	var body struct {
		Nombre   string `json:"nombre"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
	}
	if err := c.BodyParser(&body); err != nil ||
		body.Nombre == "" || body.Email == "" || len(body.Password) < 8 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "nombre, email y password (mínimo 8 caracteres) requeridos"})
	}
	if body.Rol == "" {
		body.Rol = "consulta"
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return serverError(c, "Error procesando contraseña", err)
	}
	var id int64
	err = db.QueryRowContext(c.UserContext(),
		`INSERT INTO eco_restauracion.usuarios (nombre, email, password_hash, rol)
		 VALUES ($1, lower($2), $3, $4) RETURNING id`,
		body.Nombre, body.Email, string(hash), body.Rol).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return c.Status(http.StatusConflict).JSON(fiber.Map{"error": "El email ya está registrado"})
		}
		return serverError(c, "Error al crear usuario", err)
	}
	return c.Status(http.StatusCreated).JSON(fiber.Map{"id": id})
}

func actualizarUsuario(c *fiber.Ctx) error {
	var body struct {
		Nombre   *string `json:"nombre"`
		Rol      *string `json:"rol"`
		Activo   *bool   `json:"activo"`
		Password *string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cuerpo inválido"})
	}
	id := c.Params("id")
	if body.Nombre != nil {
		if _, err := db.Exec(`UPDATE eco_restauracion.usuarios SET nombre=$1 WHERE id=$2`, *body.Nombre, id); err != nil {
			return serverError(c, "Error actualizando", err)
		}
	}
	if body.Rol != nil {
		if _, err := db.Exec(`UPDATE eco_restauracion.usuarios SET rol=$1 WHERE id=$2`, *body.Rol, id); err != nil {
			return serverError(c, "Error actualizando rol", err)
		}
	}
	if body.Activo != nil {
		if _, err := db.Exec(`UPDATE eco_restauracion.usuarios SET activo=$1 WHERE id=$2`, *body.Activo, id); err != nil {
			return serverError(c, "Error actualizando estado", err)
		}
	}
	if body.Password != nil && len(*body.Password) >= 8 {
		hash, _ := bcrypt.GenerateFromPassword([]byte(*body.Password), bcrypt.DefaultCost)
		if _, err := db.Exec(`UPDATE eco_restauracion.usuarios SET password_hash=$1 WHERE id=$2`, string(hash), id); err != nil {
			return serverError(c, "Error actualizando contraseña", err)
		}
	}
	return c.JSON(fiber.Map{"ok": true})
}

func eliminarUsuario(c *fiber.Ctx) error {
	u := c.Locals("user").(*Claims)
	if c.Params("id") == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "id requerido"})
	}
	// Evitar que el admin se elimine a sí mismo.
	if c.Params("id") == itoa(u.UserID) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "No puedes eliminar tu propio usuario"})
	}
	if _, err := db.Exec(`DELETE FROM eco_restauracion.usuarios WHERE id=$1`, c.Params("id")); err != nil {
		return serverError(c, "Error al eliminar usuario", err)
	}
	return c.JSON(fiber.Map{"ok": true})
}

func itoa(n int64) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
