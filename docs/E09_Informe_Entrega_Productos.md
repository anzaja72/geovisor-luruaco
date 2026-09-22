# Informe de entrega de productos

**Contrato:** 324 de 2025 — Servicio tecnológico para la creación y diseño de Geodatabase y realización de 4 talleres de capacitación
**Contratante:** Unión Temporal Restauración Luruaco · NIT 901.991.300-4
**Contratista:** MC Consultorías & Capacitación S.A.S. · NIT 900.614.837-8
**Dirección del proyecto:** Sonia Natalia Vásquez Díaz
**Suscripción:** 26 de febrero de 2026 · **Plazo:** 22 meses (2 de marzo de 2026 – 2 de enero de 2028)
**Fecha del informe:** 22 de septiembre de 2026
**Objeto de este informe:** sustentar el hito de pago de la cláusula tercera, numeral 3.3 — entrega final de los productos y entregables pactados

---

## 1. Resumen

La plataforma está **construida, publicada y en operación** en
[https://geodatabase.mcconsultorias.com.co](https://geodatabase.mcconsultorias.com.co),
con certificado válido, control de acceso por roles y los seis componentes del proyecto
funcionando sobre datos reales cargados en la geodatabase.

De las nueve obligaciones técnicas de la cláusula quinta, **ocho están cumplidas y
soportadas documentalmente**. La restante —los cuatro talleres de capacitación— tiene su
plan elaborado y depende de programación con la Dirección del Proyecto.

Las observaciones de septiembre del equipo técnico —las 18 de Valeria Esquea y las de
Darío, Osman Aragón y Yurani— están incorporadas en su mayoría; las que siguen abiertas se detallan en
el numeral 5, separando las que dependen de información que aún no se ha entregado de las
que están en desarrollo.

Antes de este informe se hizo una revisión completa del ambiente productivo. Se
encontraron y corrigieron doce defectos, entre ellos uno de protección de datos: las
ubicaciones de las cámaras trampa quedaban visibles para el rol de consulta tras una
reimportación. El detalle está en el [informe de pruebas](E06_Informe_Pruebas_Tecnicas.md), numeral 9.

---

## 2. Qué está en operación

| Elemento | Estado verificado |
|---|---|
| Dirección de acceso | https://geodatabase.mcconsultorias.com.co |
| Publicación | VPS con Docker Compose: Nginx, API en Go y PostgreSQL 16 + PostGIS 3.4 |
| Cifrado | TLS con Let's Encrypt, renovación automática; HTTP redirige a HTTPS |
| Autenticación | Token de sesión con vigencia de 24 horas; contraseñas con bcrypt |
| Perfiles | Consulta, técnico y administrador, aplicados en el servidor ruta por ruta |
| Componentes | Restauración, Vegetación Acuática, Ficorremediación, Fauna, Gobernanza y Dashboard Transversal |
| Tiempos de respuesta | 74–300 ms en consultas de la API; carga del documento en 0,8 s |

### Información cargada en la geodatabase

| Conjunto | Volumen |
|---|---|
| Esquema `eco_restauracion` | 26 tablas y 10 vistas |
| Coberturas vegetales (Corine) | 24 polígonos · 48,01 ha analizadas |
| Parcelas de monitoreo | 15 parcelas permanentes, más 5 puntos de ficorremediación |
| Técnicas de restauración aplicadas | 27 polígonos |
| Capas geográficas importadas | 1.135 entidades (aislamiento, limpieza, curvas de nivel, puntos y transectos de fauna) |
| Censo forestal (línea base) | 75 individuos, 12 especies, 136 fustes |
| Observaciones de fauna | 119 registros preliminares del anexo de línea base |
| Individuos sembrados | 9.605, según el reporte del equipo técnico |
| Vegetación acuática removida | 40,247 ha acumuladas a julio de 2026, en 5 polígonos de limpieza |
| Gobernanza ambiental | 18 eventos · 517 participantes · 25 fotografías referenciadas |
| Ortofotos del dron | Predio en teselas (zum 14 a 18); limpiezas de enero a julio; laboratorio de microalgas |

---

## 3. Cumplimiento de la cláusula quinta

### 5.1 · Diseño, estructuración y construcción de la geodatabase

Geodatabase construida sobre PostgreSQL 16 con PostGIS, en EPSG:4326, integrando la
información espacial, tabular y documental de los componentes. La información recibida se
depuró y estandarizó en la importación, con reproyección desde MAGNA-SIRGAS. Se integró
cartografía base oficial del IGAC mediante geoservicios (catastro, pendientes y agrología).

**Soportes:** [E01 · Diccionario de datos](E01_Diccionario_Datos_Principal.md) ·
[E03 · Metadatos ISO 19115](E03_Metadatos_ISO19115.md) ·
[modelo de datos interactivo](diagramas/modelo-datos.html)

### 5.2 · Análisis funcional y arquitectura

Requerimientos funcionales y no funcionales, arquitectura de la solución, flujos de
información y esquema de perfiles con su matriz de permisos.

**Soportes:** [E02 · Requerimientos, arquitectura y roles](E02_Requerimientos_Arquitectura_Roles.md) ·
[arquitectura interactiva](diagramas/arquitectura-aplicacion.html)

### 5.3 · Diseño UX/UI

Interfaz adaptable a distintos tamaños de pantalla, construida sobre el Manual de
Identidad Visual de la C.R.A. conforme a la Ley 2345 de 2023: isologo oficial en sus
versiones a color y en negativo, paleta institucional con sus equivalencias Pantone y
CMYK, y tipografía Lato. Todos los pares de color de texto cumplen contraste AA. Los
prototipos elaborados antes del desarrollo se conservan navegables.

**Soportes:** [E04 · Lineamientos gráficos](E04_Lineamientos_Graficos.md) ·
prototipos en `03-frontend/public/mockup/`

### 5.4 · Desarrollo tecnológico

- Backend en Go con la lógica de negocio y los cálculos de indicadores.
- Autenticación con token, contraseñas cifradas y control de acceso por rol.
- **API documentada**: 44 operaciones en OpenAPI 3.0, validadas sin errores.
- Frontend con interfaces de consulta y administración.
- Geovisor con capas conmutables, ortofoto propia, cartografía IGAC, consulta por
  elemento, medición y comparación temporal.
- Módulo de reportes en CSV, Excel y PDF; panel de indicadores por componente y tablero
  transversal.
- Cada componente abre con su propio mapa base, su ortofoto y su área de interés.
- Ficorremediación con tablero de calidad del agua: **ICA del IDEAM** (seis variables,
  hoja metodológica GCI-OE-F002 v03) y guías **CCME** para sedimento de agua dulce. Lee la
  geodatabase: campañas, puntos y mediciones salen de las tablas `ficor_*`, y lo que un
  técnico registra por el formulario aparece en el tablero. Mientras el laboratorio no
  entregue resultados, las tablas contienen una siembra de demostración **marcada como
  tal en la propia base**, que la pantalla advierte y que se borra con una orden (ver 5.1).
- Seguridad de acceso: bloqueo temporal tras intentos fallidos de inicio de sesión, efecto
  inmediato al desactivar una cuenta o cambiarle el rol, y protección de las capas
  sensibles aplicada por la propia geodatabase.
- Integración verificada entre frontend, backend y geodatabase: lo que se registra por los
  formularios se consulta desde las vistas.

**Soportes:** [E05 · Especificación de la API](E05_API_OpenAPI.yaml) ·
[recorrido del dato](diagramas/flujo-del-dato.html)

### 5.5 · Pruebas, implementación y puesta en operación

52 casos ejecutados sobre el ambiente productivo —servicios, control de acceso,
funcionalidad e infraestructura—, todos conformes. En la revisión del 22 de septiembre se
encontraron doce defectos, corregidos y verificados. Plataforma publicada y URL operativa.

**Soporte:** [E06 · Informe de pruebas técnicas](E06_Informe_Pruebas_Tecnicas.md)

### 5.6 · Soporte y mantenimiento post-implementación

Acompañamiento durante la ejecución del contrato y un año más. Canal de reporte integrado
en la plataforma, con acuerdo de nivel de servicio de **respuesta dentro de las 4 horas**
siguientes al envío del mensaje, clasificación por severidad y registro de incidencias
abierto.

**Soporte:** [E08 · Registro de incidencias](E08_Registro_Incidencias.md)

### 5.7 · Capacitación — **pendiente de programación**

Plan de los cuatro talleres elaborado, con temario, prácticas, material de apoyo y las
evidencias que se levantarán de cada sesión. **Su ejecución está sujeta a la programación
que defina la Dirección del Proyecto.**

**Soporte:** [E10 · Plan de capacitación](E10_Plan_Capacitacion_Principal.md)

### 5.8 · Entregables y documentación

Productos técnicos, código fuente, configuraciones, base de datos, manuales de usuario y
administrador, y documentación suficiente para la administración autónoma del sistema por
parte de la entidad.

**Soportes:** [E00 · Índice de entregables](E00_Indice_Entregables.md) ·
[manual de usuario](E10_Manual_Usuario_Principal.md) ·
[manual del administrador](E10_Manual_Administrador_Principal.md)

### 5.9 · Obligaciones generales técnicas

Estándares de seguridad aplicados (cifrado en tránsito, contraseñas con bcrypt, control de
acceso por rol, secretos fuera del repositorio). Software de terceros bajo licencias libres
compatibles con uso institucional; la autoría y las licencias de los modelos 3D y las
fotografías de referencia constan en `public/fauna/CREDITS.md`.

---

## 4. Productos entregados

| # | Producto | Formato |
|---|---|---|
| 1 | Geodatabase en operación (26 tablas, 10 vistas) | PostgreSQL 16 + PostGIS 3.4 |
| 2 | Plataforma web publicada | URL operativa con TLS |
| 3 | Código fuente completo | Repositorio Git |
| 4 | Diccionario de datos | E01 |
| 5 | Requerimientos, arquitectura y roles | E02 |
| 6 | Metadatos ISO 19115 | E03 |
| 7 | Lineamientos gráficos | E04 |
| 8 | Especificación de la API | E05 (OpenAPI) |
| 9 | Informe de pruebas técnicas | E06 |
| 10 | Registro de incidencias y ANS | E08 |
| 11 | Manual de usuario | E10 |
| 12 | Manual del administrador | E10 |
| 13 | Plan de capacitación | E10 |
| 14 | Diagramas interactivos (3) | HTML autónomo |
| 15 | Configuraciones de despliegue | Docker Compose y migraciones |

---

## 5. Situaciones que constan

### 5.1 · Dependen de información que no ha sido entregada

Las siguientes tablas están construidas, operativas y accesibles por la API, pero **sin
registros**, porque la información no ha sido entregada:

| Conjunto | Estado | Responsable de la entrega |
|---|---|---|
| `monitoreos` | Sin registros | Equipos de campo |
| `fotografias` (registro fotográfico por parcela) | Sin registros | Equipos de campo |
| Sitios de validación (metas y cumplimiento) | Sin registros | Dirección del Proyecto |
| Ficorremediación: calidad de agua, sedimentos y biota | Sin mediciones de laboratorio; el muestreo 1 no ha sido entregado. Falta además la **conductividad**, una de las seis variables del ICA. Las tablas contienen una siembra de demostración marcada con `es_demostracion`, que el tablero advierte en pantalla y se elimina con una sola orden al llegar los resultados | Darío · laboratorio |
| Campañas Monitoreo 1 a 4 del censo forestal | Filas previstas, sin mediciones de campo | Yurani |

La plataforma las representa como «sin dato» y no las sustituye por ceros, para no inducir
a error en la lectura de los indicadores.

Además, quedan pendientes de decisión o de archivo cuatro observaciones de septiembre:

| Observación | Qué falta | De quién |
|---|---|---|
| Reemplazar el censo de línea base por el Excel de campo (193 individuos, 22 especies) | Confirmar cuál hoja es la válida: «Formato» (193 registros) o «Sin repetir» (82) | Yurani |
| Puntos de monitoreo de mamíferos | El archivo KML, y por qué faltan las cámaras C1 y C6 | Osman |
| Línea de tiempo de fauna | Confirmar si los monitoreos 2 y 3 son de 2027 | Osman |
| Ortofoto actualizada del predio | Entrega en GeoTIFF: la ECW no se puede procesar con herramientas libres | Brandon |

El detalle de cada entrega figura en
[INFORMACION-PENDIENTE-POR-COMPONENTE.md](INFORMACION-PENDIENTE-POR-COMPONENTE.md).

### 5.2 · Ajustes de septiembre en curso

| Observación | Estado |
|---|---|
| Formulario de fauna: punto de muestreo en lugar de cobertura vegetal, y fotografía JPG | En ejecución dentro del acompañamiento de la cláusula 5.6 |
| Importación de shapefile (.zip) y GeoTIFF desde la interfaz | En ejecución. Hoy ambos se cargan en el servidor con los scripts entregados y documentados; la interfaz acepta GeoJSON y CSV |

### 5.3 · Supuesto de cálculo por confirmar

Los indicadores de densidad y área basal se calculan asumiendo una parcela de 0,1 ha. El
valor real debe confirmarlo el equipo técnico; al hacerlo, los indicadores se recalculan
sin cambios en la plataforma.

### 5.4 · Talleres de capacitación

Pendientes de programación con la Dirección del Proyecto, según lo indicado en 5.7.

---

## 6. Recomendaciones para la operación

1. **Copias de seguridad.** El servidor genera una copia completa cada noche y conserva
   las de los últimos 14 días; la del 22 de septiembre se verificó legible. Esas copias
   están en el mismo disco que la base: se recomienda sacar una copia fuera del servidor y
   probar la restauración cada trimestre.
2. **Vigilancia del certificado.** La renovación es automática; conviene verificarla antes
   de cada vencimiento.
3. **Monitoreo de disponibilidad.** Se sugiere una comprobación externa periódica del
   endpoint de salud, con aviso por correo ante caída.
4. **Cuentas.** Revisar periódicamente las cuentas activas y sus roles desde la pantalla de
   administración.
5. **Cortafuegos.** El servidor no tiene cortafuegos activo; conviene limitar la entrada a
   los puertos 80, 443 y 22.

---

## 7. Solicitud

Con fundamento en lo expuesto, se solicita a la Dirección del Proyecto la **verificación de
los productos entregados y la certificación de recibo a satisfacción**, para efectos del
pago previsto en la cláusula tercera, numeral 3.3 del contrato.

Se deja constancia de que el contratista continúa con las obligaciones de soporte y
mantenimiento de la cláusula 5.6 y con la ejecución de los talleres de la cláusula 5.7, una
vez la Dirección del Proyecto defina su programación.

---

**MC Consultorías & Capacitación S.A.S.**
NIT 900.614.837-8
Representante legal: Luisiana Estefanía Sierra Jiménez
