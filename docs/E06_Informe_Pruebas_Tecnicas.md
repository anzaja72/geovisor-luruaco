# Informe de pruebas técnicas

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Contrato:** 324 de 2025 · Unión Temporal Restauración Luruaco
**Entregable:** cláusula 5.5, literal d) — *«Entregar informe de pruebas técnicas»*
**Fecha de ejecución:** 6 de septiembre de 2026 · revisión de producción el 22 de septiembre
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
| F-06 | Ficorremediación | Conforme — el tablero lee la geodatabase; sus tablas contienen una siembra de demostración marcada, advertida en pantalla, hasta que el laboratorio entregue resultados |
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
52 casos ejecutados resultaron conformes, y los doce defectos encontrados en la revisión
del 22 de septiembre quedaron corregidos (numeral 9). Las salvedades registradas corresponden a
información de campo pendiente de entrega, no a defectos del desarrollo.

Se da por cumplido lo previsto en la cláusula 5.5 del contrato: pruebas funcionales y
técnicas ejecutadas (a), ajustes aplicados (b), plataforma publicada en ambiente
productivo (c), el presente informe (d), URL operativa (e) y funcionamiento integral del
sistema (f).

---

## 9. Revisión de producción · 22 de septiembre de 2026

Revisión completa previa a la entrega. Sobre el ambiente productivo solo se hicieron
lecturas; las correcciones se probaron en una copia con el mismo esquema de producción,
que se eliminó al terminar.

### 9.1 Comprobaciones sobre producción

| Caso | Comprobación | Resultado |
|---|---|---|
| R-01 | 12 rutas protegidas sin token: lectura, escritura, borrado, usuarios, importación, reportes y copiloto | 401 en las 12 |
| R-02 | Token falsificado con `alg=none` y rol de administrador | 401 |
| R-03 | Token con firma inválida | 401 |
| R-04 | Registro público con correo inválido y con contraseña corta | 400 y 400 |
| R-05 | Certificado TLS | Let's Encrypt, vigente hasta el 14-nov-2026 |
| R-06 | Redirección HTTP → HTTPS | 301 |
| R-07 | Carga: 1.200 peticiones, 40 simultáneas | 1.200 respondidas, ninguna con error |
| R-08 | Respaldo de la noche anterior | Íntegro: 25 tablas con datos y 10 vistas; sin errores en 14 días |
| R-09 | Consumo del servidor en 30 días | CPU media 1,2 % (máx. 4,8 %) · RAM máx. 1,5 GB de 8 · disco 22 GB de 100 · sin reinicios |
| R-10 | Código publicado en el navegador | Sin claves de API ni coordenadas de fauna |

### 9.2 Defectos encontrados y su corrección

| # | Defecto | Corrección | Verificación |
|---|---|---|---|
| D-01 | Las cámaras trampa y los transectos de herpetos se reimportaron el 18-sep sin la marca de sensibles: 19 ubicaciones visibles para el rol de consulta, que cualquiera puede crear | Migración 18: catálogo `capas_sensibles` y disparador que marca toda fila de esas capas | 0 → 19 de 19 marcadas; importación nueva marcada; no se pueden desmarcar a mano; capa no catalogada intacta; re-ejecución sin duplicados. Una cuenta de consulta recién creada recibe 8 entidades y ninguna de fauna |
| D-02 | El límite de 5 registros por hora e IP era global: detrás del proxy, la API veía siempre la misma IP (1.010 peticiones en 72 h desde una sola dirección) | La API toma la IP del visitante de `X-Forwarded-For`, que Traefik sanea | 6.ª alta desde una IP → 429; otra IP → admitida |
| D-03 | Inicio de sesión sin límite de intentos | 10 fallos por IP en 15 minutos → bloqueo temporal | 11.º intento → 429; otra IP entra con normalidad |
| D-04 | Desactivar una cuenta o cambiarle el rol no surtía efecto hasta que vencía su token (24 h) | La cuenta se verifica en cada petición | Con el mismo token: al pasar a consulta, reportes → 403; al desactivarla → 401 |
| D-05 | Cada sesión descargaba 6,7 MB de capas; 6,6 MB eran curvas de nivel que ningún componente dibuja | El visor pide solo las capas que muestra | 6.736 KB → 32 KB por sesión |
| D-06 | Sin cabeceras de seguridad HTTP | `nosniff`, `Referrer-Policy`, HSTS y `frame-ancestors` limitado al sitio de la C.R.A. | Configuración validada con `nginx -t` |
| D-07 | Re-ejecutar la migración 17 borraba los puntos de fauna cargados después | Solo siembra si las capas están vacías | 20 entidades antes y después de re-ejecutarla |
| D-08 | El script de respaldo del repositorio apuntaba a un contenedor inexistente, y el manual pedía crear un segundo respaldo y restaurar con un comando incompatible con el formato real | Script corregido, respaldo diario versionado y manual reescrito | Genera un respaldo restaurable; si falla, conserva los anteriores |
| D-09 | Vegetación acuática y el tablero transversal mostraban la serie antigua (marzo a mayo) junto a la nueva (enero a julio) | El texto se deriva del mismo dato que la gráfica | Revisión en pantalla |
| D-10 | La tarjeta de fauna del tablero transversal decía «sin dato» y «En definición con Darío» | Lee los registros de la geodatabase | Revisión en pantalla |
| D-11 | La contraseña de la base de **desarrollo** figuraba en siete archivos del repositorio público. La de producción es distinta y no estuvo expuesta | Los scripts y los compose la leen del entorno | Ningún archivo del repositorio la contiene |
| D-12 | El tablero de ficorremediación calculaba sobre constantes del navegador: no leía la geodatabase y no habría mostrado las mediciones reales aunque existieran. Las tablas no guardaban campaña ni punto | Migración 19: `campana` y `es_demostracion` en las tres tablas, y la siembra de demostración pasa a la base. La pantalla lee la geodatabase y el formulario exige campaña y punto | Cadena completa: la API devuelve 288 filas marcadas; el formulario rechaza el registro sin campaña (400), sin punto (400) y con punto inexistente (400), y lo acepta completo (201); lo registrado aparece en el tablero, sin la marca de demostración, y su campaña se añade al selector. Un punto con menos de las seis variables del ICA queda sin calificar, no calificado a medias |

### 9.3 Verificación posterior al despliegue

Publicadas las correcciones el 22 de septiembre de 2026 y comprobadas sobre el ambiente
productivo. La migración se aplicó tras un respaldo, verificado restaurable.

| Caso | Comprobación | Resultado |
|---|---|---|
| V-01 | Disponibilidad tras el despliegue | `/` y `/health` en 200 |
| V-02 | Cabeceras de seguridad | `nosniff`, `Referrer-Policy`, HSTS y `frame-ancestors` limitado al sitio de la C.R.A. |
| V-03 | Bloqueo por intentos fallidos | 10 respuestas 401 y la 11.ª, 429 |
| V-04 | Capas sensibles en la geodatabase | 19 de 19 entidades de fauna marcadas |
| V-05 | Lo que recibe una cuenta de consulta recién creada | 8 entidades; ninguna cámara trampa ni transecto |
| V-06 | Registro público con `"rol":"administrador"` | El servidor asigna `consulta` |
| V-07 | Permisos de consulta | zonas 200 · reportes 403 · importación 403 · monitoreos 403 · usuarios 403 |
| V-08 | Peso de las capas por sesión | 6.738 KB sin filtro → 30 KB con el filtro que usa el visor |
| V-09 | Desactivación inmediata | Con el mismo token: 200 con la cuenta activa, 401 «Cuenta desactivada o inexistente» tras desactivarla |
| V-10 | Ficorremediación desde la geodatabase | 288 mediciones en 3 campañas y 5 puntos, todas marcadas como demostración |
| V-11 | Código publicado | Sin claves ni datos de demostración incrustados; el visor pide las capas filtradas |
| V-12 | Cuentas en producción | Solo las tres del proyecto; eliminadas las de verificación |

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
