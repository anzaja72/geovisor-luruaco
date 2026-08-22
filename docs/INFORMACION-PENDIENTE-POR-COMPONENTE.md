# Información pendiente por componente — Geovisor Luruaco

**Contrato 324 de 2025 · C.R.A.** — Solicitud de información para completar los 4 componentes del geovisor.
Fecha: 2026-06-21 · Estado de la geodatabase: coberturas, parcelas, técnicas, aislamiento y maleza ya cargados con datos reales.

---

## 🌱 1. Restauración Ecológica

| # | Falta | Detalle | A quién pedírselo |
|---|---|---|---|
| 1 | **Fórmula real de densidad / área basal** | Hoy se asume parcela = 0,1 ha (1,5 ha en 15 parcelas) por falta de confirmación. Cambia el valor de los KPIs "Densidad/ha" y "Área basal/ha" | Yurani |
| 2 | **Registro de siembra** | El censo es de *medición*, no de *plantación*. Sin esto, "Total de individuos sembrados" queda en s/d | Yurani / Brandon |
| 3 | **Shapefile del predio (y predio ampliado)** | Solo existe el polígono de "Aislamiento externo"; no hay un límite de predio independiente para la capa "Predio / Predio ampliado" del mapa | Brandon |
| 4 | **Mediciones de campo de Monitoreo 1 a 4** | Las filas existen en el Excel pero vienen vacías (sin especie, altura, DAP). Hoy el geovisor muestra honestamente "Sin mediciones registradas" para esas fechas | Yurani (próximas campañas) |
| 5 | **Fotografías antes/después por parcela** | Pedido explícito en la reunión del 19-jun. 0 fotos cargadas todavía (ni siquiera las 11 de bioremediación) | Brandon / Yurani |
| 6 | **Ortofoto del predio (dron)** | El archivo de 5,8 GB sigue en descarga incompleta (Terabox) desde hace más de 24 h | Brandon (reenviar o confirmar canal de descarga) |

---

## 🌊 2. Maleza Acuática

| # | Falta | Detalle | A quién pedírselo |
|---|---|---|---|
| 1 | **Imágenes satelitales/dron por fecha de monitoreo** | Es el pedido central de Yurani en la reunión ("dos o tres imágenes… línea base, monitoreo 1, monitoreo 2"). Hoy el comparador usa un gráfico esquemático, no imágenes reales | Brandon / Yurani |
| 2 | **Longitud real del borde intervenido** | El dato "~3,1 km" mostrado es una estimación mía, no una medición reportada | Yurani |
| 3 | **Volumen de biomasa retirada** | Sin reportar; el indicador queda en s/d | Equipo de campo |

---

## 🧪 3. Ficorremediación

| # | Falta | Detalle | A quién pedírselo |
|---|---|---|---|
| 1 | **Coordenadas reales del punto de inoculación** | Solo hay 1 punto con 11 fotos de evidencia, sin coordenadas GPS asociadas; hoy se ubica de forma esquemática en el centro de la laguna | Equipo de ficorremediación |
| 2 | **Metadatos del punto** | Tipo de consorcio microalgal, fecha de inoculación, dosis aplicada — ninguno reportado | Equipo de ficorremediación |
| 3 | **Puntos de muestreo de agua y sedimentos** | Cero puntos cargados; no hay shapefile ni registro | Equipo de ficorremediación |
| 4 | **Parámetros de calidad del agua** | pH, oxígeno disuelto, fósforo, nitrógeno, conductividad, turbidez — todos en "sin dato" | Equipo de ficorremediación / laboratorio |
| 5 | **Frontera de influencia real** | Hoy es un círculo esquemático; falta la geometría real del área de influencia | Equipo de ficorremediación |
| 6 | **Serie de reducción de contaminantes** | Depende directamente de los puntos 3 y 4; sin esos datos no se puede calcular | — |

> Este componente es casi en su totalidad estructura vacía — no es una tarea de carga pendiente de mi parte, es que el dato de campo todavía no existe o no se ha entregado.

---

## 🦜 4. Monitoreo de Fauna

| # | Falta | Detalle | A quién pedírselo |
|---|---|---|---|
| 1 | **Definición de variables del tablero** | Especies objetivo, grupos taxonómicos, esfuerzo de muestreo, índices a calcular. Sin esto no se puede avanzar más allá de la estructura preliminar ya construida | **Darío** |
| 2 | **Puntos de monitoreo / cámaras trampa** | Sin ubicaciones reales | Darío (una vez definidas las variables) |

---

## 📊 Transversal

| # | Falta | Detalle |
|---|---|---|
| 1 | **Participantes capacitados (gobernanza)** | Este indicador no corresponde a ninguno de los 4 componentes acordados en la reunión del 19-jun; quedó por arrastre del diseño anterior de 3 componentes. **Decidir:** ¿se mantiene como quinto eje (Gobernanza) o se retira del transversal? |

---

## Resumen ejecutivo (para enviar)

> Restauración y Maleza Acuática tienen su esqueleto numérico real y sólido (censo forestal, coberturas Corine, polígonos de limpieza), pero falta evidencia visual y de campo que ya fue solicitada en la reunión del 19 de junio: imágenes satelitales por fecha (Maleza), fotografías antes/después por parcela (Restauración) y el predio como capa independiente. Ficorremediación y Fauna son honestamente estructura vacía: el primero espera puntos de muestreo y parámetros de calidad de agua del equipo técnico; el segundo espera que Darío defina sus variables.

### Lista de contacto

| Responsable | Pendientes a su cargo |
|---|---|
| **Yurani** | Fórmula de densidad/área basal · próximas campañas de monitoreo · longitud real del borde de maleza |
| **Brandon** | Shapefile del predio · fotos antes/después · imágenes satelitales por fecha · estado de la ortofoto |
| **Equipo de ficorremediación** | Coordenadas y metadatos del punto de inoculación · puntos de muestreo · parámetros de calidad de agua |
| **Darío** | Variables del tablero de Monitoreo de Fauna |
| **Decisión interna** | Si Gobernanza/Participantes capacitados se mantiene en el dashboard transversal |
