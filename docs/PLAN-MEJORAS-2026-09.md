# Plan de cambios — Geovisor Luruaco (solicitudes de septiembre 2026)

**Estado:** propuesta para aprobación. Nada implementado todavía.
**Rama:** `claude/geovisor-ficorremediacion-viz-506b12`
**Fecha:** 2026-09-12

---

## 0. Qué se analizó

| Fuente | Autor / fecha | Qué aporta |
|---|---|---|
| `Mejoras Geovisor de Restauración Ecológica.pdf` | Valeria Esquea · 9-sep-2026 | 18 observaciones sobre 5 componentes + importación de archivos |
| `Ejemplo geovisor ficorremediación (1).pdf` | Darío · 12-sep-2026 | **La referencia visual**: 5 capturas de los geovisores del INVEMAR (ICAM y SIGMA) |
| `Actividades contempladas (1).docx` | Osman Aragón · 9-sep-2026 | Rediseño del componente de fauna (puntos, formulario, gráficos, línea de tiempo) |
| `Datos de campo-Comunitario.xlsx` | Yurani | Censo de línea base **corregido** que reemplaza al actual |
| Carpeta de Drive (ortofotos) | Brandon | Ortofotos actualizadas: predio, limpiezas y laboratorio |
| Captura de WhatsApp | Yurani · martes | Individuos sembrados 17.565 → **9.605**; reemplazar datos anteriores |

> La carpeta de Drive `1CvpIbh8…` no es accesible desde el conector de Drive de esta sesión (solo aparece compartida la carpeta antigua de `dronticom@gmail.com`). Las ortofotos hay que descargarlas a mano o volver a compartir la carpeta con la cuenta del proyecto.

**Lectura general:** de las 18 observaciones, 14 son ajustes de capa/copy/UX que tocan archivos ya existentes. Las 4 restantes —el rediseño de ficorremediación, la carga masiva por CSV, la carga de ortofotos mensuales y el rediseño del formulario de fauna— exigen cambios de modelo de datos y de backend.

---

## 1. BLOQUE A — Ficorremediación: nueva forma de visualizar los resultados

Es el único cambio estructural de visualización, y el de mayor esfuerzo. El resto del documento depende poco de este bloque, así que puede ejecutarse en paralelo.

### A.0 Qué está pidiendo Darío exactamente

El PDF de ejemplo no trae texto: son capturas de dos geovisores del INVEMAR. Leídas juntas definen el patrón que quiere:

**Páginas 1–2 · Geovisor ICAM (Índice de Calidad de Aguas Marinas y Costeras)**

1. Una **escala de calificación del índice** siempre visible en la cabecera: `PÉSIMA · INADECUADA · ACEPTABLE · ADECUADA · ÓPTIMA`, en barra de color.
2. Navegación por **estación** (paginador «1 de 15») y por **muestreo** (selector de campaña «2026--5»).
3. Un **medidor (gauge) 0–100** con el valor del índice para el sitio y el muestreo seleccionados.
4. **Tarjetas de contexto**: nº de variables, % de confianza, promedio histórico, visitas realizadas, veces reportado.
5. **Ficha de la estación**: nombre, valor del índice con su categoría, variables/confianza, sustrato, coordenadas y la lista de «curvas de calidad» — cada variable con su valor normalizado y su categoría en color (`PH: 87,58 (ADECUADA) · PO4: 21,36 (PÉSIMA) · SST: 96,13 (ÓPTIMA)`).
6. **Mapa** con las estaciones coloreadas por categoría; al hacer clic, el popup repite la misma ficha.
7. **Panel histórico por variable**, con flechas ‹ › para pasar de una variable a otra: arriba la curva de calidad por muestreo (barras con bandas de categoría), abajo el valor crudo por muestreo.
8. Pestañas **Mapa / Histórico de la estación** y, en el pie, enlaces a **descarga de datos** y al **protocolo del indicador**.

**Páginas 3–5 · Geovisor SIGMA (restauración de manglar)**

9. **Panel de filtros** encadenados (departamento → municipio → proyecto → sector → año) con botón «Buscar».
10. **Panel flotante con pestañas** sobre el mapa — «Información del proyecto» / «Información del sector» / «Siembra por especies» —, con tablas Item/Valor y un gráfico con **botón de descarga**.

**Traducción al proyecto:** el resultado de ficorremediación deja de ser una rejilla estática de 29 celdas «sin dato» y pasa a ser un **tablero por punto y por campaña, con calificación por variable**. Las variables biológicas (biota) se presentan como **riqueza y abundancia por grupo**, en barras, con serie temporal y matriz de especies en ventana.

### A.1 El problema de fondo: hoy el dato no tiene dónde colgarse

Tres hallazgos del código actual que bloquean cualquier visualización tipo ICAM:

| # | Hallazgo | Evidencia |
|---|---|---|
| A.1.1 | Las mediciones **no guardan el punto**. Las tablas tienen la columna `punto_id`, pero el `INSERT` del formulario nunca la llena. | `02-backend/formularios.go:130-152` |
| A.1.2 | Las mediciones **no guardan la campaña**. Solo hay `fecha`, así que no existe «línea base / monitoreo 1». | `04-base-de-datos/11_ficorremediacion.sql:31-71` |
| A.1.3 | **No existen umbrales**: no hay forma de decir si un pH de 8,1 es ÓPTIMA o PÉSIMA. | — |

Sin resolver los tres, el gauge, las categorías de color y el histórico no se pueden calcular. Por eso el bloque A empieza por datos, no por pantalla.

### A.2 Migración `04-base-de-datos/18_ficor_indice.sql` (nueva)

```
ficor_calidad_agua        + campana TEXT, + laboratorio TEXT, + metodo TEXT,
                          + limite_deteccion NUMERIC, + observaciones TEXT
                          (punto_id pasa a obligatorio de hecho)
ficor_calidad_sedimentos  + los mismos campos
ficor_biota               + campana TEXT, + punto_id obligatorio

ficor_biota_especies (nueva)   punto_id, campana, fecha, grupo, especie,
                               abundancia  → matriz de especies para la ventana

ficor_umbrales (nueva)         matriz ('agua'|'sedimento'), variable, unidad,
                               tipo_curva, p1..p4 (cortes de las 5 categorías),
                               sentido ('mayor_mejor'|'menor_mejor'|'optimo_rango'),
                               fuente_normativa, vigente_desde
                               → ÚNICA fuente de verdad de la calificación

vw_ficor_indice (vista)        punto_id, campana, fecha, indice_0_100,
                               categoria, n_variables, completitud_pct
```

`ficor_umbrales` se siembra con los valores que apruebe Darío (ver §A.5). Ninguna calificación queda cableada en el frontend.

### A.3 Backend — `02-backend/ficorremediacion.go` (nuevo, sale de `lecturas.go`)

| Endpoint | Para qué |
|---|---|
| `GET /api/ficor/puntos` | GeoJSON de los 5 puntos, con índice y categoría de la campaña seleccionada → pinta el mapa por color |
| `GET /api/ficor/mediciones?punto=&campana=&matriz=` | Ficha del punto: variables con valor, unidad, valor normalizado y categoría |
| `GET /api/ficor/series?variable=&punto=` | Histórico de una variable en un punto (alimenta los dos gráficos de la derecha) |
| `GET /api/ficor/umbrales` | Tabla de calificación, para la leyenda y el pie metodológico |
| `GET /api/ficor/biota?campana=` | Riqueza y abundancia por grupo + matriz de especies |
| `POST /api/ficor/import/csv` | **Carga masiva** (§F.3) |
| `GET /api/reportes/ficor` | Descarga CSV/Excel de lo mostrado |

Además, `POST /api/ficor/medicion` pasa a exigir `punto_id` y `campana`.

### A.4 Frontend — reescritura de `FicorView.tsx` + componentes nuevos

Archivos nuevos bajo `03-frontend/src/components/ficor/`:

| Componente | Qué dibuja | Equivale en el ejemplo a |
|---|---|---|
| `EscalaCalificacion.tsx` | Barra de 5 categorías en la cabecera | Cabecera del ICAM |
| `GaugeIndice.tsx` | Medidor 0–100 con aguja y categoría | «Valor del ICAM para el sitio» |
| `FichaPunto.tsx` | Paginador «1 de 5» + datos del punto + lista de variables calificadas | Ficha de estación |
| `CurvaCalidad.tsx` | Barras por campaña con bandas de color | «Comportamiento histórico de la curva de calidad» |
| `SerieTemporal.tsx` | Valor crudo por campaña | «Comportamiento histórico del PH en el sitio» |
| `TablaMatriz.tsx` | Tabla Item/Valor/Unidad/Categoría + descarga | Panel con pestañas del SIGMA |
| `BiotaBarras.tsx` | Riqueza y abundancia por grupo | — (pedido de §A.6) |
| `lib/ficor.ts` | `normalizar(valor, umbral)` → 0–100 → `Categoria` | — |

**Reutilización, no invención:** `03-frontend/src/lib/quality.ts` ya define la escala ICAM completa (`pesima`/`inadecuada`/`aceptable`/`adecuada`/`optima`) con los mismos colores del ejemplo. Se usa tal cual; no se crea una paleta nueva.

**Distribución de la pantalla** (tres columnas en escritorio, apiladas en móvil):

```
┌───────────── Ficorremediación ·  [Campaña ▾] [Punto ▾] [Matriz ▾] ──── escala ▓▓▓▓▓ ┐
├──────────────┬───────────────────────────────┬──────────────────────────────────────┤
│  GAUGE 0-100 │   MAPA (5 puntos por color)   │  ‹ Variable: Oxígeno Disuelto ›       │
│  categoría   │   + popup = ficha del punto   │  ─ curva de calidad por campaña       │
│              │                               │  ─ valor crudo por campaña            │
│  nº variables│   ── ficha del punto ──       │                                       │
│  completitud │   1 de 5 · FICO-3             │  (flechas para pasar de variable)     │
│  campañas    │   coords · matriz · fecha     │                                       │
│  última fecha│   lista de variables calif.   │                                       │
├──────────────┴───────────────────────────────┴──────────────────────────────────────┤
│  [ Agua ] [ Sedimentos ] [ Biota ]   tabla completa + ⬇ descargar CSV                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  Ortofoto del laboratorio con área de interés (§A.7)  ·  Registro fotográfico        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Comportamiento sin datos: si una campaña no tiene mediciones, el gauge se muestra en gris «SIN DATO» (ya previsto en `quality.ts:24`) y la ficha lista las variables previstas como pendientes. No se inventan ceros.

### A.5 Las variables biológicas y el índice — decisión pendiente

Para que exista una categoría hace falta un umbral por variable. Recomendación concreta:

- **Agua → adoptar el ICA del IDEAM**, no el ICAM. El ICAM es para aguas marinas y costeras; la ciénaga de Luruaco es agua dulce continental. El ICA del IDEAM es el índice oficial colombiano para ese caso, tiene la misma estructura de 5 categorías y la misma presentación que le gustó a Darío. Se calcula con 6 variables: oxígeno disuelto (% saturación), sólidos suspendidos totales, DQO, conductividad, pH y relación nitrógeno total/fósforo total.
  - **De esas 6, el proyecto ya mide 4** (OD, SST, pH, N total y P total). **Faltan conductividad y DQO** — hay que pedirlas al laboratorio; hoy se mide DBO5, que no sustituye a la DQO en la fórmula.
  - Las curvas de sub-índice deben tomarse de la hoja metodológica del IDEAM, no de memoria. Es el insumo #1 a confirmar.
- **Sedimentos →** metales pesados y plaguicidas se califican contra guías de calidad de sedimentos (ISQG/PEL). No hay norma colombiana específica; hay que decidir la referencia con Darío.
- **Biota →** no se califica con una escala de calidad. Se presenta como **riqueza y abundancia por grupo** (fitoplancton, zooplancton, ictioplancton, macroinvertebrados bentónicos, perifiton, ictiofauna), en dos gráficos de barras, con serie por campaña y matriz de especies en ventana. Es exactamente el mismo tratamiento que Osman pide para fauna en el `.docx`, y conviene que se vean iguales.

### A.6 Presentación de las variables biológicas

Dos barras horizontales lado a lado —una de riqueza, una de abundancia—, ambas por grupo, con selector de campaña; debajo, botón «Ver matriz de especies» que abre una ventana con la tabla completa. Mismo componente que se usará en fauna (§D.6), para no mantener dos gráficos gemelos.

### A.7 Mapa del componente y ortofoto del laboratorio

- Mapa base por defecto **Calles (OSM)** (pedido 2 del PDF) — hoy todos los componentes arrancan en Sentinel-2.
- **Quitar la ortofoto del predio** de este componente (pedido 1) — hoy se muestra en los cuatro mapas.
- Reemplazar el `OrtoFoto` estático del laboratorio por un mapa con: **polígono del área de interés**, ortofoto del laboratorio en tiles, marcador con el nombre y ficha lateral con la **fotografía del laboratorio** (las piscinas) — como en la imagen del PDF.

### A.8 Esfuerzo del bloque A

| Tarea | Tamaño |
|---|---|
| Migración + siembra de umbrales | M |
| Backend (7 endpoints) | L |
| Reescritura de la vista + 8 componentes | XL |
| Ortofoto/AOI del laboratorio | M (depende de los archivos de Drive) |

---

## 2. BLOQUE B — Restauración ecológica

| # | Pedido | Cambio | Archivo |
|---|---|---|---|
| B.1 | Agregar la ortofoto actualizada | Tilear el ECW nuevo y apuntar el `TileLayer` a la capa nueva. **Ojo:** GDAL libre no lee ECW; ver §H.1 | `scripts/tile_ortofotos_temporales.sh`, `MapView.tsx:349-361` |
| B.2 | «Quitar las demás capas existentes» | La captura marca en rojo los **mapas base alternativos** (Topográfico, Calles, Lona negra, Lona clara, Océano). Dejar solo Satelital + las 4 sobrecapas del recuadro verde (Ortofoto, Predio/Aislamiento, Parcelas, Coberturas). Se hace con una lista de mapas base permitidos por componente | `basemaps.ts`, `MapView.tsx` |
| B.3 | — | Las capas IGAC y las temáticas quedan disponibles pero apagadas, salvo que se pida retirarlas del todo | `IgacOverlays.tsx` |

---

## 3. BLOQUE C — Vegetación acuática

| # | Pedido | Cambio | Archivo |
|---|---|---|---|
| C.1 | Quitar la ortofoto de restauración | Es el mismo arreglo transversal de §G.1 | `MapView.tsx:349` |
| C.2 | Zoom al área de interés al entrar | Definir `AOI_POR_COMPONENTE` (bounds del borde de la ciénaga) y encuadrar ahí en vez del predio | `MapView.tsx:28-31, 176-215` |
| C.3 | Todas las ortofotos posteriores a limpieza + sus polígonos en el mapa principal | Registrar cada ortofoto mensual como capa de tiles con sus bounds, mostrarlas juntas en el mapa del componente y dejar el comparativo antes/después debajo (donde ya está) | `MapView.tsx`, `OrtoComparador.tsx` |
| C.4 | «Estos botones no direccionan a ningún lugar» | **Confirmado**: el estado `fecha` de los botones Línea base/Marzo/Abril/Mayo solo cambia el resaltado; no filtra nada. Conectarlos a la ortofoto, el polígono y el acercamiento de ese mes | `MalezaView.tsx:9, 46-54` |
| C.5 | Quitar el ítem «Borde de laguna intervenido ~3,1 km» | Eliminar el KPI y su lectura `borde_km`; quedan 3 KPIs | `MalezaView.tsx:62-65` |
| C.6 | Maleza removida = **40.247 ha** a julio | Actualizar el acumulado y la serie. **A confirmar:** con 19,0 ha en mayo, se entiende **40,247 ha** (formato colombiano), no cuarenta mil | `data.ts:59-63`, `MalezaView.tsx:108` |

---

## 4. BLOQUE D — Monitoreo de fauna

### Del PDF de Valeria

| # | Pedido | Cambio | Archivo |
|---|---|---|---|
| D.1 | Íconos irreconocibles (aves «parece una pala», anfibios «un reloj», reptiles «una línea») | Redibujar los símbolos SVG `bird`, `frog`, `snake` | `Shell.tsx:36-39` |
| D.2 | Los puntos sobre el modelo 3D confunden | **Propuesta 2**: lista de especies registradas; al elegir una se muestra su modelo 3D o su foto. Se retira la botonera de partes del cuerpo | `FaunaView.tsx:169-176`, `faunaFichas.ts` |
| D.3 | Poco contraste de puntos y líneas en el mapa | Subir contraste, agregar halo blanco y aumentar el radio de los símbolos | `MapView.tsx:85-91` |
| D.4 | «Línea punteada NO está punteada» | Corregir el estilo `.sh.dash` | `geovisor.css` |
| D.5 | Puntos muestreados y cámaras trampa no se ven en el mapa | Los contadores están escritos a mano en `0` y los símbolos cuadrado/triángulo/círculo de la leyenda no se usan en el mapa. Calcularlos del dato y usar los mismos símbolos | `FaunaView.tsx:186-190, 197-202` |
| D.6 | Tipografía en itálica difícil de leer | Quitar `font-style: italic` (7 apariciones) salvo en nombres científicos, donde es convención | `geovisor.css:344,356,375,382,440,476`, `dashboard.css:1132` |

### Del `.docx` de Osman

| # | Pedido | Cambio |
|---|---|---|
| D.7 | Mapa del área de restauración con coberturas **y** fauna | Hoy fauna no recibe coberturas; habilitarlas para este componente (`MapView.tsx:285`) |
| D.8 | Agregar puntos de monitoreo de mamíferos (KML enviado por WhatsApp) | Importar el KML → `capas_geograficas`. **Falta el archivo** |
| D.9 | Nombrar los puntos «Aves · Punto de muestreo #1 · coordenada» | Cambiar el rótulo y el popup de los puntos |
| D.10 | En el formulario: **quitar** «Cobertura vegetal» y **agregar** selección de punto de muestreo, precargada por grupo (Herpetos #1…#7, etc.) | `MonitoreoModal.tsx:221-222`, `fauna_observaciones` + `punto_id`, `formularios.go` |
| D.11 | En el formulario: permitir subir una foto JPG | Campo de archivo + almacenamiento + `foto_url` en la tabla. Es el único pedido que introduce **carga de binarios** al backend |
| D.12 | Dos gráficos de barras de resultados: riqueza por grupo y abundancia por grupo | Mismo componente que §A.6 |
| D.13 | La matriz de especies dentro de una ventana, no expuesta | Mover la tabla de registros a un modal, con botón «Ver matriz de especies» |
| D.14 | Línea de tiempo de muestreos | Línea base (julio 2026) · Monitoreo 1 (noviembre 2026) · Monitoreo 2 (marzo 2026) · Monitoreo 3 (agosto 2026). **A confirmar:** los monitoreos 2 y 3 dicen 2026 pero van después de noviembre de 2026; se entiende **2027** |

---

## 5. BLOQUE E — Gobernanza ambiental

| # | Pedido | Cambio | Archivo |
|---|---|---|---|
| E.1 | Quitar la tabla «Actividades por ubicación» y usar el espacio para más fotos | Eliminar el panel y dar el ancho completo al carrusel | `GobernanzaView.tsx:101-117` |
| E.2 | Pasar de una foto a otra sin cerrar el visor | Agregar flechas ‹ › y teclas en la ventana ampliada del carrusel 3D. `GaleriaFotos` ya lo hace; falta en `Carousel3D` | `Carousel3D.tsx:159` |
| E.3 | El carrusel gira demasiado rápido | Reducir el factor de arrastre e inercia (`0.05`) y bajar la velocidad de giro | `Carousel3D.tsx:79-83` |

---

## 6. BLOQUE F — Importación de archivos

Hoy `ImportModal` acepta solo `.geojson/.json/.csv`, lee el archivo como texto y lo manda al backend; el CSV solo crea **puntos** en `capas_geograficas`. Nada de eso sirve para los tres pedidos.

| # | Pedido | Propuesta |
|---|---|---|
| F.1 | Cargar `.tif`/`.ecw` de ortofotos, mes a mes | Una ortofoto son cientos de MB o GB: no puede pasar por el modal. Propuesta: subida al servidor por partes + tileado en segundo plano con `gdal2tiles`, y una tabla nueva `ortofotos (etiqueta, componente, fecha, bounds, estado)` que el visor lee para pintar la capa. Mientras tanto, el `script` existente cubre el caso con intervención manual. **ECW: ver §H.1** |
| F.2 | Cargar `.shp` para polígonos | El shapefile son 4+ archivos. Propuesta: aceptar un `.zip` y convertirlo en el backend con `ogr2ogr` (ya existe `scripts/import_shapefile.sh`), reutilizando el camino de GeoJSON |
| F.3 | CSV con todos los parámetros de ficorremediación, que actualice por ubicación | `POST /api/ficor/import/csv`. Acepta formato **ancho** (una fila por punto y fecha, una columna por variable) o **largo** (`punto, campana, fecha, matriz, variable, valor, unidad`), valida contra el catálogo de variables y `ficor_umbrales`, y devuelve un informe de filas aceptadas/rechazadas. **Hablarlo con Darío** antes de fijar el formato, como pide el PDF |

---

## 7. BLOQUE G — Corrección de datos

| # | Origen | Cambio |
|---|---|---|
| G.1 | WhatsApp | Individuos sembrados **17.565 → 9.605** (`data.ts:14` y el texto de `data.ts:53-56`) |
| G.2 | WhatsApp | Las etiquetas «Línea base (Julio 2026)» y «Monitoreo 1 (noviembre 2026)» **ya están aplicadas** en `RestauracionView.tsx:14-17`. Sin cambio |
| G.3 | `Datos de campo-Comunitario.xlsx` | **Reemplazar el censo de línea base completo.** Borrar `arboles_monitoreo` para `fecha='Linea base'` y cargar la hoja nueva |

### Qué trae el Excel nuevo (hoja «Formato», la completa)

| | Actual en la plataforma | Excel nuevo |
|---|---|---|
| Individuos | 75 | **193** |
| Parcelas | 15 | **11** (BD1, CU2, DD1, DD2, DD3, DD5, DD6, DD7, VS1, VS2, VS3) |
| Especies | 12 | **22** |
| Fechas de campo | — | 22, 23 y 24 de julio y 10 y 11 de agosto de 2026 |
| Vivos / muertos | no se registraba | **170 vivos / 23 muertos** |
| Altura media | 5,5 m | **1,85 m** (184,6 cm) |
| Diámetro medio | — | 2,35 cm |

**Hay una hoja «Sin repetir» con 82 filas y 8 parcelas.** Antes de cargar hay que confirmar cuál es la buena: «Formato» (193 registros) o «Sin repetir» (82). **Decisión pendiente.**

**El Excel trae tres columnas que la tabla actual no tiene** y que vale la pena aprovechar: `Origen` (N = natural / P = plantado), `Mortalidad` (Vivo/Muerto) y `Estado 1-5`. Con `Origen='P'` y `Mortalidad` se puede calcular por fin la **tasa de supervivencia de lo plantado**, que es justo el indicador que hoy queda en «s/d» y el que da sentido a la cifra de 9.605 sembrados. Requiere ampliar `arboles_monitoreo` (migración `19_arboles_campo.sql`) y ajustar los cálculos de `restauracion.go`.

**Conversión necesaria:** el Excel trae la altura en **centímetros**; la tabla la guarda en **metros**.

---

## 8. Un solo cambio transversal que resuelve cuatro pedidos

Tres observaciones distintas (B.2, C.1, C.2, A.7) son en realidad el mismo defecto: **`MapView` trata a los cuatro componentes por igual**. La ortofoto del predio está fija y encendida (`MapView.tsx:349`), el mapa base siempre arranca en Sentinel-2 (`MapView.tsx:337`) y el encuadre por defecto es siempre el predio (`MapView.tsx:28-31`).

Se arregla con una sola tabla de configuración por componente:

```ts
const CONFIG_COMPONENTE = {
  restauracion:     { basemap: 's2',     ortofotoPredio: true,  aoi: PREDIO_BOUNDS,   basemapsVisibles: ['s2'] },
  maleza:           { basemap: 's2',     ortofotoPredio: false, aoi: CIENAGA_BOUNDS,  ortofotosMensuales: true },
  ficorremediacion: { basemap: 'calles', ortofotoPredio: false, aoi: FICOR_BOUNDS },
  fauna:            { basemap: 's2',     ortofotoPredio: false, aoi: PREDIO_BOUNDS,   coberturas: true },
}
```

Conviene hacerlo **primero**: desbloquea B.2, C.1, C.2, D.7 y A.7 de una vez.

---

## 9. Orden de ejecución propuesto

| Fase | Contenido | Depende de |
|---|---|---|
| **1** | §8 configuración por componente · C.4 botones muertos · C.5 KPI de borde · E.1–E.3 gobernanza · D.1 íconos · D.4 punteada · D.6 itálicas · G.1 cifra de sembrados | Nada. Todo visible el mismo día |
| **2** | G.3 recarga del censo (migración `19` + importación) | Confirmar hoja del Excel |
| **3** | A.2 migración · A.3 backend · F.3 CSV de ficorremediación | Umbrales aprobados por Darío |
| **4** | A.4 reescritura de la vista de ficorremediación · A.6 biota | Fase 3 |
| **5** | D.7–D.14 fauna (formulario, puntos, foto, gráficos, ventana, línea de tiempo) | KML de mamíferos |
| **6** | B.1 · C.3 · A.7 ortofotos y laboratorio · F.1 · F.2 | Archivos de Drive en formato utilizable |

---

## 10. Lo que hace falta decidir antes de empezar

| # | Pregunta | Para quién | Bloquea |
|---|---|---|---|
| H.1 | **Las ortofotos vienen en ECW.** GDAL en su versión libre no lee ECW, así que hoy no se pueden tilear. ¿Se pueden reentregar en GeoTIFF, o conviertes tú desde QGIS/ERDAS? | Brandon | B.1, C.3, A.7, F.1 |
| H.2 | **Umbrales de calificación del agua.** ¿Se adopta el ICA del IDEAM (6 variables)? Si sí, faltan **conductividad** y **DQO** en el plan de laboratorio | Darío | Todo el bloque A |
| H.3 | **Umbrales de sedimentos.** ¿Contra qué guía se califican metales y plaguicidas? | Darío / laboratorio | A.5 |
| H.4 | **Formato del CSV de ficorremediación** (ancho o largo, nombres de columnas, cómo se identifica el punto) | Darío | F.3 |
| H.5 | **Excel de restauración:** ¿«Formato» (193 registros) o «Sin repetir» (82)? | Yurani | G.3 |
| H.6 | **Maleza removida:** ¿40,247 ha o 40.247 ha? | Yurani | C.6 |
| H.7 | **Fechas de fauna:** monitoreo 2 (marzo) y 3 (agosto), ¿2027? | Osman | D.14 |
| H.8 | **KML de puntos de mamíferos** — el `.docx` dice que se envió por WhatsApp; no llegó al repositorio ni está en disco | Osman | D.8 |
| H.9 | **Acceso a la carpeta de Drive** con las ortofotos actualizadas | Brandon | Fase 6 |
| H.10 | **Restauración, «quitar las demás capas»:** se entiende que son los mapas base alternativos (lo marcado en rojo). ¿Se confirma que las coberturas Corine se quedan? | Valeria | B.2 |
