# Requerimientos, arquitectura y esquema de roles

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Contrato:** UTL-001 de 2026 · Unión Temporal Restauración Luruaco
**Entregable:** cláusula 5.2, literal e) — *«Entregar documento de requerimientos, diagrama de arquitectura y esquema de roles»*
**Elaboró:** MC Consultorías & Capacitación S.A.S.

---

## 1. Objeto y alcance

La plataforma reúne en un solo lugar la información espacial, tabular y documental que
genera el proyecto de restauración de la Ciénaga de Luruaco, y la presenta de forma que
pueda consultarse, monitorearse y auditarse a lo largo del tiempo.

Está organizada en **seis componentes**: cuatro con geovisor sobre el predio
—Restauración Ecológica, Vegetación Acuática, Ficorremediación y Monitoreo de Fauna—,
uno de registro de actividades —Gobernanza Ambiental— y un tablero que consolida el
avance de todos —Dashboard Transversal—, más el módulo de Descarga de Datos.

---

## 2. Requerimientos funcionales

| # | Requerimiento | Dónde se resuelve |
|---|---|---|
| RF-01 | Almacenar la información geográfica del proyecto en una base espacial única | PostGIS, esquema `eco_restauracion` (25 tablas, 10 vistas) |
| RF-02 | Visualizar las capas sobre el predio con cartografía base y ortofoto propia | Geovisor con Leaflet; ortofoto del dron en teselas |
| RF-03 | Consultar los atributos de cualquier elemento | Ficha emergente por elemento, con la nomenclatura de parcela y el nombre de la técnica aplicada |
| RF-04 | Integrar cartografía oficial | Geoservicios del IGAC: catastro, pendientes y agrología |
| RF-05 | Dar trazabilidad temporal | Selector de campaña de monitoreo y comparador antes/después con ortofotos |
| RF-06 | Calcular indicadores del componente de restauración | Riqueza, densidad/ha, área basal/ha, altura media y Shannon, desde el censo forestal |
| RF-07 | Registrar información de campo | Formularios por componente, con cola local cuando no hay conexión |
| RF-08 | Importar capas externas | GeoJSON y CSV desde la interfaz; shapefile y GeoTIFF por script en el servidor |
| RF-09 | Exportar información | Cinco reportes en CSV, Excel y PDF; descarga de capas en GeoJSON |
| RF-10 | Controlar el acceso por perfiles | Autenticación con token y tres roles diferenciados |
| RF-11 | Consultar el estado del proyecto en lenguaje natural | Copiloto que responde con las cifras de la geodatabase |
| RF-12 | Reportar incidencias | Módulo de soporte con acuerdo de nivel de servicio |

## 3. Requerimientos no funcionales

| # | Requerimiento | Cómo se cumple |
|---|---|---|
| RNF-01 | Acceso por internet sin instalación | Aplicación web; solo se requiere navegador |
| RNF-02 | Tráfico cifrado | TLS con renovación automática (Let's Encrypt vía Traefik) |
| RNF-03 | Datos no accesibles sin autorización | Todo recurso bajo `/api` exige token; verificado en el informe de pruebas |
| RNF-04 | Tiempos de respuesta adecuados | 74–300 ms en las consultas de la API; carga del documento en 0,8 s |
| RNF-05 | Adaptable a distintos tamaños de pantalla | Diseño responsivo |
| RNF-06 | Identidad institucional | Manual de Identidad Visual de la C.R.A. (Ley 2345 de 2023) |
| RNF-07 | Interoperabilidad | GeoJSON (RFC 7946) en EPSG:4326; API documentada en OpenAPI |
| RNF-08 | Trazabilidad de la información | Fecha de creación y responsable en los registros de campo |
| RNF-09 | Administración autónoma por la entidad | Manuales, diccionario de datos y procedimientos de operación |
| RNF-10 | Continuidad ante fallo del proveedor de IA | El copiloto responde con los datos aunque el modelo no esté disponible |

---

## 4. Arquitectura

### 4.1 Vista general

```
                        ┌───────────────────────────┐
   Usuario              │        Navegador          │
   (consulta,           │  React + Leaflet + three  │
    técnico,            └─────────────┬─────────────┘
    administrador)                    │ HTTPS
                                      ▼
                        ┌───────────────────────────┐
                        │          Traefik          │  TLS · Let's Encrypt
                        └─────────────┬─────────────┘
                                      │
                        ┌─────────────▼─────────────┐
                        │   geodb-frontend (Nginx)  │  aplicación compilada
                        │   sirve / y /tiles        │  + teselas de la ortofoto
                        └─────────────┬─────────────┘
                                      │  /api  (proxy interno)
                        ┌─────────────▼─────────────┐        ┌──────────────────┐
                        │   geodb-backend (Go)      │───────▶│  Proveedor LLM   │
                        │   API REST · JWT · roles  │        │  (opcional)      │
                        └─────────────┬─────────────┘        └──────────────────┘
                                      │ SQL
                        ┌─────────────▼─────────────┐
                        │  geodb-postgis            │  PostgreSQL 16 + PostGIS 3.4
                        │  esquema eco_restauracion │  EPSG:4326
                        └───────────────────────────┘
```

Los tres contenedores viven en una red interna; **ninguno publica puertos al exterior**.
La única entrada es Traefik.

### 4.2 Componentes

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Presentación | React 19, TypeScript, Vite | Interfaz, geovisor, gráficas y visor 3D |
| Cartografía | Leaflet | Mapas base, capas del proyecto, IGAC, medición |
| Visualización 3D | three.js (carga diferida) | Especímenes de fauna; solo se descarga al abrir ese componente |
| Servicios | Go 1.26 con Fiber | API REST, autenticación, reportes, importación, copiloto |
| Datos | PostgreSQL 16 + PostGIS 3.4 | Almacenamiento espacial y alfanumérico |
| Publicación | Nginx, Docker Compose, Traefik | Servido estático, orquestación y TLS |

### 4.3 Flujo de una consulta

1. El usuario inicia sesión; el backend valida contra `usuarios` y devuelve un token
   firmado con vigencia de 24 horas.
2. La aplicación pide las capas del componente; cada petición viaja con el token.
3. El backend comprueba token y rol, consulta PostGIS y devuelve GeoJSON en EPSG:4326.
4. El navegador dibuja las capas sobre la ortofoto y calcula los tableros.

### 4.4 Flujo de un registro de campo

1. El técnico completa el formulario del componente.
2. Si hay conexión, el registro se envía y queda almacenado con su responsable y fecha.
3. Si no la hay, se guarda en el navegador y **se envía solo al recuperar internet**.

### 4.5 Flujo del copiloto

1. La pregunta llega al backend con el token del usuario.
2. El backend **lee las cifras de PostGIS** y arma el contexto.
3. Si hay proveedor configurado, le pide que redacte, con la instrucción explícita de no
   inventar cifras. Si no lo hay o falla, compone la respuesta con esos mismos datos.
4. Devuelve texto, fuentes y los componentes donde consultar lo respondido.

La clave del proveedor reside únicamente en el backend.

---

## 5. Esquema de roles

### 5.1 Definición

| Rol | Perfil | Alcance |
|---|---|---|
| `consulta` | Público general, veedurías, comunidad | Ver los componentes y sus indicadores. No descarga información, no registra datos y no recibe las capas con ubicaciones sensibles |
| `tecnico` | Profesionales de campo e interventoría | Todo lo anterior sin restricciones, más registrar monitoreos, importar capas y descargar reportes |
| `administrador` | Responsable de la plataforma | Control total, incluida la administración de cuentas y el borrado de registros |

Las cuentas de consulta pueden crearse desde la propia página de inicio; los roles de
técnico y administrador solo los asigna un administrador.

### 5.2 Permisos por operación

| Operación | consulta | tecnico | administrador |
|---|:--:|:--:|:--:|
| Ver componentes, mapas e indicadores | ✓ | ✓ | ✓ |
| Preguntar al copiloto | ✓ | ✓ | ✓ |
| Cambiar su propia contraseña | ✓ | ✓ | ✓ |
| Ver capas con ubicaciones sensibles | — | ✓ | ✓ |
| Descargar reportes (CSV, Excel, PDF) | — | ✓ | ✓ |
| Registrar monitoreos y observaciones | — | ✓ | ✓ |
| Importar capas (GeoJSON / CSV) | — | ✓ | ✓ |
| Editar registros de monitoreo | — | ✓ | ✓ |
| Eliminar registros de monitoreo | — | — | ✓ |
| Crear, modificar y desactivar cuentas | — | — | ✓ |

**Qué se considera sensible.** Las ubicaciones de cámaras trampa y los transectos de
herpetofauna. Divulgarlas facilita la sustracción de los equipos y la presión sobre la
fauna, así que la consulta pública recibe los indicadores agregados pero no esos puntos.
La exclusión la aplica el servidor sobre la columna `sensible` de `capas_geograficas`:
no depende de que la interfaz oculte la capa.

### 5.3 Aplicación técnica

El control se aplica en el servidor, ruta por ruta, no en la interfaz: aunque un usuario
manipule el navegador, la API rechaza lo que su rol no autoriza.

- Sin token o con token vencido → **401**
- Token válido con rol insuficiente → **403**

La interfaz se limita a ocultar lo que el usuario no puede usar, como comodidad. El
detalle por endpoint está en la [especificación de la API](E05_API_OpenAPI.yaml) y la
verificación, en el [informe de pruebas](E06_Informe_Pruebas_Tecnicas.md), casos S-01 a S-10.

### 5.4 Gestión de credenciales

Las contraseñas se almacenan con `bcrypt`; nunca en texto plano ni de forma reversible.
El administrador inicial se crea al arrancar el backend con las variables del entorno. Los
tokens se firman con `JWT_SECRET` y caducan a las 24 horas.

---

## 6. Decisiones de diseño y sus motivos

| Decisión | Motivo |
|---|---|
| Una sola base espacial, sin duplicar capas por componente | Cada componente filtra lo que le concierne; evita versiones divergentes del mismo dato |
| Los indicadores se calculan en el servidor | Un único resultado para todos los usuarios y para los reportes |
| three.js con carga diferida | Los 185 kB del motor 3D no penalizan a quien no abre Fauna |
| El copiloto no calcula cifras | Reduce a cero el riesgo de que el asistente invente datos ante la interventoría |
| Sin puertos publicados salvo Traefik | Menor superficie expuesta |
| Vacíos declarados en la interfaz | «Sin mediciones registradas» es información; un cero sería un error |

---

## 7. Trazabilidad con el contrato

| Cláusula | Requerimiento | Estado |
|---|---|---|
| 5.1 a–e | Geodatabase, validación, estandarización, modelo e integración de cartografía oficial | Cumplido |
| 5.1 f | Metadatos técnicos | [E03_Metadatos_ISO19115.md](E03_Metadatos_ISO19115.md) |
| 5.2 a–e | Requerimientos, roles, arquitectura y flujos | Este documento |
| 5.3 a–d | UX/UI, responsivo, prototipo y lineamientos | [E04_Lineamientos_Graficos.md](E04_Lineamientos_Graficos.md) |
| 5.4 a–g | Backend, seguridad, API, frontend, geovisor, reportes e integración | Cumplido · API en [E05](E05_API_OpenAPI.yaml) |
| 5.5 a–f | Pruebas, publicación y URL operativa | [E06_Informe_Pruebas_Tecnicas.md](E06_Informe_Pruebas_Tecnicas.md) |
| 5.6 a–d | Soporte y registro de incidencias | [E08_Registro_Incidencias.md](E08_Registro_Incidencias.md) |
| 5.8 a–c | Entregables, código y documentación | Repositorio del proyecto y carpeta `docs/` |
