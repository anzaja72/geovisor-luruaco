package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// Backend es el único canal hacia los datos: la API REST del backend Go. El MCP
// nunca abre una conexión a PostgreSQL; el filtrado de capas sensibles y la
// verificación de cuenta en cada petición los hace el backend.
type Backend struct {
	base string
	http *http.Client
}

type Usuario struct {
	ID     int64  `json:"id"`
	Nombre string `json:"nombre"`
	Email  string `json:"email"`
	Rol    string `json:"rol"`
}

// ErrBackend lleva el estado HTTP que devolvió el backend.
type ErrBackend struct {
	Status int
	Msg    string
}

func (e *ErrBackend) Error() string { return fmt.Sprintf("backend %d: %s", e.Status, e.Msg) }

func (b *Backend) do(ctx context.Context, method, path string, q url.Values, jwt string, body any) ([]byte, error) {
	u := b.base + path
	if len(q) > 0 {
		u += "?" + q.Encode()
	}
	var rd io.Reader
	if body != nil {
		buf, _ := json.Marshal(body)
		rd = bytes.NewReader(buf)
	}
	req, err := http.NewRequestWithContext(ctx, method, u, rd)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if jwt != "" {
		req.Header.Set("Authorization", "Bearer "+jwt)
	}
	res, err := b.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("backend no disponible: %w", err)
	}
	defer res.Body.Close()
	data, err := io.ReadAll(io.LimitReader(res.Body, 32<<20))
	if err != nil {
		return nil, err
	}
	if res.StatusCode >= 400 {
		var e struct {
			Error string `json:"error"`
		}
		_ = json.Unmarshal(data, &e)
		return nil, &ErrBackend{Status: res.StatusCode, Msg: e.Error}
	}
	return data, nil
}

// Login valida credenciales contra /api/auth/login (tabla usuarios).
func (b *Backend) Login(ctx context.Context, email, pass string) (string, *Usuario, error) {
	data, err := b.do(ctx, http.MethodPost, "/api/auth/login", nil, "",
		map[string]string{"email": email, "password": pass})
	if err != nil {
		return "", nil, err
	}
	var out struct {
		Token   string  `json:"token"`
		Usuario Usuario `json:"usuario"`
	}
	if err := json.Unmarshal(data, &out); err != nil || out.Token == "" {
		return "", nil, errors.New("respuesta de login inválida")
	}
	return out.Token, &out.Usuario, nil
}

// Me confirma que el JWT sigue vigente y devuelve el rol ACTUAL de la cuenta
// (el backend relee la tabla usuarios en cada petición).
func (b *Backend) Me(ctx context.Context, jwt string) (*Usuario, error) {
	data, err := b.do(ctx, http.MethodGet, "/api/auth/me", nil, jwt, nil)
	if err != nil {
		return nil, err
	}
	var u Usuario
	if err := json.Unmarshal(data, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (b *Backend) Get(ctx context.Context, path string, q url.Values, jwt string) (any, error) {
	data, err := b.do(ctx, http.MethodGet, path, q, jwt, nil)
	if err != nil {
		return nil, err
	}
	var v any
	if err := json.Unmarshal(data, &v); err != nil {
		return nil, err
	}
	return v, nil
}

func (b *Backend) Post(ctx context.Context, path string, body any, jwt string) (any, error) {
	data, err := b.do(ctx, http.MethodPost, path, nil, jwt, body)
	if err != nil {
		return nil, err
	}
	var v any
	if err := json.Unmarshal(data, &v); err != nil {
		return nil, err
	}
	return v, nil
}
