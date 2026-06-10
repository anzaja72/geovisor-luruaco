-- ============================================================
-- MIGRACIÓN 06: usuarios y roles (Especificación §8)
-- Roles: administrador (control total) | tecnico (carga/edición) | consulta (lectura)
-- Idempotente. Fecha: 2026-06-10
-- ============================================================

SET search_path TO eco_restauracion, public;

CREATE TABLE IF NOT EXISTS eco_restauracion.usuarios (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20) NOT NULL DEFAULT 'consulta'
                  CHECK (rol IN ('administrador','tecnico','consulta')),
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON eco_restauracion.usuarios(email);

COMMENT ON TABLE eco_restauracion.usuarios IS
    'Usuarios de la plataforma. El admin inicial se siembra desde el backend (ADMIN_EMAIL/ADMIN_PASSWORD).';

SELECT 'Migración 06 (usuarios) aplicada' AS mensaje;
