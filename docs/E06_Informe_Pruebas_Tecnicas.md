# Informe de pruebas técnicas

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Contrato:** UTL-001 de 2026 · Unión Temporal Restauración Luruaco
**Entregable:** cláusula 5.5, literal d) — *«Entregar informe de pruebas técnicas»*
**Fecha de ejecución:** 6 de septiembre de 2026
**Ejecutado por:** MC Consultorías & Capacitación S.A.S.

---

## 1. Alcance

Se verifica el funcionamiento de la plataforma **en el ambiente productivo**, no en
un entorno de laboratorio. Las pruebas cubren cuatro frentes:

| Frente | Casos | Qué comprueba |
|---|---|---|
| Disponibilidad y servicios de la API | 30 | Que cada recurso documentado responda con los datos esperados |
| Control de acceso | 11 | Que la información no sea accesible sin autorización |
| Funcionalidad de la interfaz | 11 | Que cada componente del geovisor cargue y opere |
| Entorno de publicación | — | Certificado, protocolo, tiempos y volumen transferido |

**Total: 52 casos ejecutados, 52 conformes.**

### Criterio de no destrucción

Las pruebas de escritura (crear, actualizar, eliminar) **no se ejecutaron contra datos
reales**: verificar `POST`, `PUT` y `DELETE` con un token válido habría dejado registros
espurios en la base de producción. En su lugar se comprobó que esos mismos verbos quedan
bloqueados sin credenciales (casos S-05, S-06 y S-08), que es la garantía que interesa
en ambiente productivo. La operación de escritura se valida en desarrollo a través de
los formularios de captura.

---

## 2. Ambiente de prueba

| Elemento | Valor |
|---|---|
| URL productiva | https://geodatabase.mcconsultorias.com.co |
| Versión desplegada | Identidad institucional, visor 3D de fauna y copiloto operativos (verificado por comportamiento en el propio ambiente) |
| Servidor | VPS Ubuntu · Docker Compose (proyecto `geovisor`) |
| Servicios | `geodb-frontend` (Nginx), `geodb-backend` (Go/Fiber), `geodb-postgis` (PostGIS 16-3.4) |
| Proxy y TLS | Traefik con Let's Encrypt |
| Navegador | Chrome 148 |

---

## 3. Disponibilidad y servicios de la API

Se consultó cada recurso con una sesión de rol `administrador`.

| Caso | Recurso | Resultado | Tiempo |
|---|---|---|---|
| P-01 | `GET /health` | 200 | 376 ms |
| P-02 | `GET /api/zonas` | 200 | 109 ms |
| P-03 | `GET /api/zonas/{id}` | 200 | 78 ms |
| P-04 | `GET /api/zonas/{id}/puntos` | 200 | 75 ms |
| P-05 | `GET /api/puntos` | 200 | 77 ms |
| P-06 | `GET /api/lotes` | 200 | 74 ms |
| P-07 | `GET /api/coberturas` | 200 | 86 ms |
| P-08 | `GET /api/capas` | 200 | 140 ms |
| P-09 | `GET /api/capas/geojson` | 200 | 213 ms |
| P-10 | `GET /api/estratos` | 200 | 585 ms |
| P-11 | `GET /api/malezas` | 200 | 1.623 ms |
| P-12 | `GET /api/tecnicas` | 200 | 218 ms |
| P-13 | `GET /api/validacion` | 200 | 76 ms |
| P-14 | `GET /api/fotografias` | 200 | 76 ms |
| P-15 | `GET /api/monitoreos` | 200 | 78 ms |
| P-16 | `GET /api/fauna/observaciones` | 200 | 78 ms |
| P-17 | `GET /api/resumen` | 200 | 78 ms |
| P-18 | `GET /api/restauracion/indicadores?fecha=Linea base` | 200 | 114 ms |
| P-19 | …con filtro `&cobertura=denso` | 200 | 80 ms |
| P-20 | `GET /api/usuarios` | 200 | 77 ms |
| P-21 | `GET /api/auth/me` | 200 | 76 ms |
| P-22 – P-24 | `GET /api/reportes/sitios` en CSV, Excel y PDF | 200 | 82 / 80 / 129 ms |
| P-25 – P-28 | `GET /api/reportes/{coberturas, monitoreos, indicadores, insumos}` | 200 | 76 – 80 ms |
| P-29 | `POST /api/copiloto` con una pregunta del proyecto | 200 | — |
| P-30 | `POST /api/copiloto` con pregunta vacía (rechazo esperado) | 400 | — |

**Observación sobre P-11.** La consulta de malezas tardó 1,6 s frente a los 80–200 ms
del resto. Es la primera consulta que toca esa tabla tras el arranque, de modo que el
tiempo corresponde al calentamiento de la conexión, no a la consulta en sí; repeticiones
posteriores bajan al rango normal. No obstante, conviene vigilarla cuando la tabla crezca.

### Volumen de datos servido

| Recurso | Registros |
|---|---|
| Capas geográficas importadas | 1.130 entidades |
| Técnicas de restauración aplicadas | 27 polígonos |
| Coberturas vegetales (Corine) | 24 polígonos |
| Puntos de monitoreo | 20 · de ellos 15 parcelas permanentes y 5 de ficorremediación |
| Observaciones de fauna | 119 registros |
| Estratos de vegetación | 3 |
| Malezas | 2 |
| Zonas de restauración / lotes | 1 / 1 |
| Usuarios activos | 3 |
| Ortofoto (teselas) | niveles de zum 14 a 18 |

Tres tablas responden correctamente pero **sin registros**: `monitoreos`, `fotografias`
y `validacion`. No es un defecto de la plataforma —los servicios responden y el geovisor
las representa como «sin datos»— sino información de campo aún no entregada. Ver el
apartado 7.

---

## 4. Control de acceso

| Caso | Prueba | Esperado | Obtenido |
|---|---|---|---|
| S-01 | Lectura sin token | 401 | 401 |
| S-02 | Token inválido | 401 | 401 |
| S-03 | Credenciales incorrectas | 401 | 401 |
| S-04 | Inicio de sesión sin cuerpo | 400 | 400 |
| S-05 | Escritura sin token (`POST /api/monitoreos`) | 401 | 401 |
| S-06 | Borrado sin token (`DELETE /api/monitoreos/{id}`) | 401 | 401 |
| S-07 | Gestión de usuarios sin token | 401 | 401 |
| S-08 | Importación de capas sin token | 401 | 401 |
| S-09 | Recurso inexistente con sesión válida | 404 | 404 |
| S-10 | Verificación de disponibilidad sin token | 200 | 200 |
| S-11 | Consulta al copiloto sin token | 401 | 401 |

Ningún recurso de datos quedó accesible sin autenticación. El esquema de roles
—`administrador`, `tecnico`, `consulta`— está implementado en el middleware del backend
y documentado en la especificación de la API; la separación entre lectura, edición y
administración se aplica ruta por ruta.

---

## 5. Funcionalidad de la interfaz

| Caso | Prueba | Resultado |
|---|---|---|
| F-01 | Carga del geovisor con sesión activa | Conforme |
| F-02 | Marca institucional (isologo oficial de la C.R.A.) | Conforme |
| F-03 | Restauración: indicadores de riqueza, densidad, área basal e individuos sembrados | Conforme |
| F-04 | Restauración: línea de tiempo por campaña de monitoreo | Conforme |
| F-05 | Vegetación acuática | Conforme |
| F-06 | Ficorremediación | Conforme |
| F-07 | Fauna: visor 3D de especímenes, 4 grupos | Conforme |
| F-08 | Fauna: mapa de puntos, leyenda y resumen de abundancias | Conforme |
| F-09 | Gobernanza: registro fotográfico, 25 fotos con su referencia | Conforme |
| F-10 | Panel transversal | Conforme |
| F-11 | Módulo de descarga de reportes (CSV, Excel, PDF) | Conforme |

### 5.1 Copiloto del geovisor

Verificado en producción con una sesión de rol `administrador`:

| Comprobación | Resultado |
|---|---|
| Responde con las cifras de la geodatabase | Conforme |
| Cita la tabla de la que provienen | Conforme — `puntos_monitoreo` |
| Ofrece el acceso al componente correspondiente | Conforme — Restauración Ecológica |
| Redacción por el proveedor configurado | Activa · `nvidia/nemotron-3-ultra-550b-a55b` |

Respuesta obtenida a la pregunta «¿Cuántas parcelas de monitoreo hay?»:

> Hay 15 parcelas de monitoreo permanentes, identificadas como BD1, BR1, CU1, CU2, CU3,
> DD1, DD2, DD3, DD4, DD5, DD6, DD7, VS1, VS2 y VS3.

La cifra y la nomenclatura corresponden a los registros de `puntos_monitoreo` con
`tipo_monitoreo = 'parcela'`, lo que confirma que la respuesta se construye sobre el dato
almacenado y no sobre una estimación del modelo.

---

## 6. Entorno de publicación

| Elemento | Medición |
|---|---|
| Certificado TLS | Let's Encrypt, vigente del 16-ago-2026 al 14-nov-2026 |
| Redirección HTTP → HTTPS | 308 permanente |
| Protocolo | HTTP/2 |
| Tiempo hasta el primer byte | 233 ms |
| Carga del documento | 822 ms |
| Respuesta media de la API | 301 ms |
| JavaScript transferido | 457 kB |
| Hojas de estilo | 19 kB |
| Modelo 3D (bajo demanda) | 1.795 kB |
| Estado del backend (`/health`) | `{"status":"ok"}` |

La renovación del certificado es automática (certbot / Traefik); aun así conviene
verificarla antes del 14 de noviembre de 2026.

---

## 7. Observaciones y recomendaciones

1. **Tres tablas sin registros.** `monitoreos`, `fotografias` y `validacion` responden
   correctamente pero están vacías, y el componente de ficorremediación carece de datos
   de campo (coordenadas de inoculación, puntos de muestreo y parámetros de calidad del
   agua). La plataforma está construida y operativa para recibirlos; la carga depende de
   la entrega de la información por parte de los equipos técnicos del proyecto.

2. **Rutas inexistentes devuelven el documento principal.** Al ser una aplicación de
   página única, una ruta desconocida responde `200` con el HTML de la aplicación en vez
   de `404`. Es el comportamiento habitual y no afecta a la seguridad ni al uso, pero
   puede confundir a quien consulte archivos directamente. Se sugiere excluir del
   enrutado las rutas de archivos estáticos.

3. **Vigilar la consulta de malezas** cuando la tabla crezca (ver P-11).

4. **Copias de seguridad.** El servicio de respaldo diario está configurado en el
   despliegue; se recomienda verificar periódicamente la restauración efectiva de una
   copia, no solo su generación.

---

## 8. Conclusión

La plataforma se encuentra **publicada en ambiente productivo y operativa**, con
certificado válido, control de acceso efectivo y todos sus componentes funcionales. Los
52 casos ejecutados resultaron conformes. Las salvedades registradas corresponden a
información de campo pendiente de entrega, no a defectos del desarrollo.

Se da por cumplido lo previsto en la cláusula 5.5 del contrato: pruebas funcionales y
técnicas ejecutadas (a), ajustes aplicados (b), plataforma publicada en ambiente
productivo (c), el presente informe (d), URL operativa (e) y funcionamiento integral del
sistema (f).

---

### Anexo · Reproducción de las pruebas

Los casos P-01 a P-28 y S-01 a S-10 se ejecutan contra la API con cualquier cliente HTTP
autenticado; la especificación completa de los recursos está en
[`E05_API_OpenAPI.yaml`](E05_API_OpenAPI.yaml). Ejemplo de verificación de disponibilidad
y de control de acceso:

```bash
curl -s https://geodatabase.mcconsultorias.com.co/health
```

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://geodatabase.mcconsultorias.com.co/api/zonas
```

El primero debe devolver `{"status":"ok"}`; el segundo, `401` al no incluir credenciales.
