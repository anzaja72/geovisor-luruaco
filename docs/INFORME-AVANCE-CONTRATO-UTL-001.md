# Informe de Avance — Contrato UTL:001

**Servicio tecnológico para la creación y diseño de Geodatabase y realización de 4 talleres de capacitación**

| Dato | Valor |
|---|---|
| Contrato | UTL:001 |
| Contratante | Unión Temporal Restauración Luruaco (NIT 901.991.300-4) |
| Contratista | MC Consultorías & Capacitación S.A.S. (NIT 900.614.837-8) |
| Valor total | $143.592.540 M/L |
| Plazo | 22 meses |
| Inicio | 02 de marzo de 2026 |
| Fin contractual | 02 de enero de 2028 |
| Fecha de este informe | 24 de junio de 2026 |
| Tiempo transcurrido | ~3,7 meses de 22 (≈ 17 % del plazo) |

> Este informe corresponde al soporte técnico exigido en la cláusula tercera (3.2) para el pago contra avance comprobado de actividades — anexa el estado real de la Geodatabase y de la plataforma a la fecha.

---

## 1. Resumen ejecutivo

La plataforma (Geodatabase + geovisor + módulos de reportes) está **publicada en ambiente productivo** en `https://geodatabase.mcconsultorias.com.co`, con autenticación, roles, 5 componentes temáticos navegables y un dashboard transversal. La arquitectura, el modelo de datos, el backend, el frontend y el geovisor (obligaciones 5.2 a 5.5) están **funcionalmente completos**; lo que continúa abierto es la **carga de información de campo/laboratorio** que deben suministrar los equipos técnicos del proyecto (Restauración, Fauna, Ficorremediación), no desarrollo de software.

| Frente contractual | Estado |
|---|---|
| 5.1 Geodatabase (diseño y construcción) | 🟢 Estructurada — pendiente población de campañas 1-4 y metadatos formales |
| 5.2 Arquitectura funcional | 🟢 Completa |
| 5.3 Diseño UX/UI | 🟢 Completo (estilo institucional aplicado a los 5 componentes) |
| 5.4 Desarrollo tecnológico | 🟢 Completo y en producción |
| 5.5 Pruebas, implementación y puesta en operación | 🟡 En producción; pendiente informe formal de pruebas técnicas |
| 5.6 Soporte post-implementación | 🟢 En curso (corrección continua, esta semana incluida) |
| 5.7 Capacitación (4 talleres) | 🔴 No iniciada |
| 5.8 Entregables y documentación | 🟡 Documentación técnica parcial (faltan manuales formales firmados) |

---

## 2. Avance por obligación contractual (cláusula quinta)

### 5.1 Diseño, estructuración y construcción de la Geodatabase
- ✅ Geodatabase oficial creada en PostgreSQL/PostGIS (`restauracion_ecologica`, esquema `eco_restauracion`), con SRID 4326, geometrías validadas y relaciones por FK.
- ✅ 21 tablas activas + vistas de indicadores (`vw_indicadores_restauracion`, `vw_fauna_total`, `vw_gobernanza_resumen`).
- ✅ Información recibida e integrada de los componentes: Restauración (censo forestal real), Maleza/Vegetación Acuática (polígonos reales), Gobernanza (actividades reales), Ficorremediación (puntos georreferenciados).
- 🟡 **Pendiente:** depuración/normalización formal bajo lineamientos IGAC e ISO 19115, y metadatos técnicos completos (ver §4).
- 🔴 **Pendiente:** integración de cartografía base institucional oficial (hoy se usa imagen satelital Esri/Maxar como base, no cartografía IGAC entregada por la entidad).

### 5.2 Análisis funcional y arquitectura de la plataforma
- ✅ Roles definidos y operativos: `administrador`, `tecnico`, `consulta` (tabla `usuarios`, JWT, middleware `requireAuth`).
- ✅ Arquitectura: SPA React (frontend) + API REST Go/Fiber (backend) + PostGIS, documentada en `01-ARQUITECTURA.md` / `10-INFRAESTRUCTURA-PRODUCCION.md`.
- ✅ Flujos de información definidos por componente (capas, puntos, coberturas, temáticas).

### 5.3 Diseño UX/UI
- ✅ Lineamientos gráficos institucionales (C.R.A.) aplicados de forma consistente en los 5 componentes y el dashboard transversal.
- ✅ Diseño responsive (sidebar colapsable, grillas adaptables, breakpoints móvil/tablet probados).
- 🟡 Wireframes/mockups como artefacto formal de entrega: existen como HTML de mockup (`03-frontend/public/mockup/`), no como documento de diseño firmado.

### 5.4 Desarrollo tecnológico
- ✅ Backend Go (Fiber) con autenticación JWT, control de acceso por rol, API documentada por rutas (`02-backend/main.go`, `auth.go`, `crud.go`, `restauracion.go`, `reportes.go`, `tematicas.go`).
- ✅ Frontend React/TypeScript con 5 vistas de componente + dashboard transversal + reportes.
- ✅ Geovisor (Leaflet) con capas por componente, medición, búsqueda de lugar, exportación GeoJSON, ortofoto dron.
- ✅ Módulo de reportes/indicadores (`ReportesView`, `vw_indicadores_restauracion`).
- ✅ Integración frontend–backend–Geodatabase verificada end-to-end (login real, CRUD de puntos, carga de capas).

### 5.5 Pruebas, implementación y puesta en operación
- ✅ Plataforma publicada en ambiente productivo: **https://geodatabase.mcconsultorias.com.co** (Docker + Traefik + TLS, VPS Hetzner).
- ✅ URL operativa de acceso entregada y funcionando.
- ✅ Verificación funcional manual de cada cambio antes de publicar (login, render de componentes, persistencia en BD).
- 🔴 **Pendiente:** informe formal de pruebas técnicas como documento de entrega (hoy la verificación es continua pero no está consolidada en un acta/informe único).

### 5.6 Soporte y mantenimiento post-implementación
- ✅ Soporte correctivo activo y continuo (ajustes de componentes, corrección de credenciales, mejoras de UI bajo demanda).
- 🟡 **Pendiente como entregable formal:** registro estructurado de incidencias (hoy el seguimiento vive en el historial de cambios del repositorio, no en una bitácora formal de soporte).

### 5.7 Capacitación
- 🔴 **No iniciada.** 0 de 4 talleres realizados. Sin fecha programada aún.
- 🔴 Material de apoyo y memorias de capacitación: no generados (dependen de la programación de los talleres).

### 5.8 Entregables y documentación
- ✅ Código fuente, configuraciones y base de datos están versionados y entregables (repositorio del proyecto).
- 🟡 Manuales técnico y de usuario: existen versiones preliminares (`E10_Manual_Administrador_Principal.md`, `E10_Manual_Usuario_Principal.md`, `E01_Diccionario_Datos_Principal.md`) pendientes de validación final con el contratante.
- 🔴 Plan de capacitación (`E10_Plan_Capacitacion_Principal.md`) existe como borrador, pendiente de cruzar con la programación real de los 4 talleres (obligación 5.7).

---

## 3. Estado actual de la Geodatabase (datos, no estructura)

| Tabla | Filas | Estado |
|---|---:|---|
| `arboles_monitoreo` | 148 | 75 individuos con especie en **Línea base**; Monitoreo 1-4 con 15 filas cada uno **sin datos de campo** (solo placeholders) |
| `capas_geograficas` | 1.114 | Curvas de nivel (1.106), maleza acuática (5), aislamiento interno (3) — reales |
| `coberturas_vegetales` | 24 | Real (Corine, levantamiento dron) |
| `puntos_monitoreo` | 20 | 15 parcelas de Restauración + 5 puntos de Ficorremediación — **reales y georreferenciados** |
| `tecnicas_restauracion` | 27 | Real |
| `lotes_bioaumentacion` | 1 | Real (capa restringida, no se expone en el geovisor) |
| `estratos_vegetacion` | 3 | Real |
| `insumos_dron` | 8 | Real |
| `gobernanza_actividades` | 7 | **Real y completo** (socializaciones, talleres, capacitaciones, jornadas, negocios verdes — Excel del componente) |
| `usuarios` | 3 | admin / técnico / consulta |
| `fauna_grupos_resumen` | 0 | Estructura lista — **sin datos** |
| `fauna_diversidad_curvas` | 0 | Estructura lista — **sin datos** |
| `ficor_calidad_agua` | 0 | Estructura lista (15 variables del Excel) — **sin datos** |
| `ficor_calidad_sedimentos` | 0 | Estructura lista (metales + plaguicidas) — **sin datos** |
| `ficor_biota` | 0 | Estructura lista (6 grupos) — **sin datos** |
| `documentos` | 0 | Tabla del modelo general (spec), no usada aún |
| `fotografias` | 0 | Tabla del modelo general (spec); evidencia fotográfica real (11 fotos de ficorremediación, fotos de fauna) aún no cargada aquí |
| `indicadores_ambientales` | 0 | Tabla del modelo general (spec), no usada aún |
| `monitoreos` / `parcelas` | 0 | Tablas del modelo general (spec); el dato real vive hoy en `arboles_monitoreo` / `puntos_monitoreo` |

---

## 4. Información faltante en base de datos, por componente

### 🌱 Restauración Ecológica
1. **Mediciones de campo de Monitoreo 1 a 4** — las 15 filas por monitoreo existen pero sin especie/altura/DAP. *Responsable: equipo de campo (Yurani).*
2. **Fórmula real de densidad/área basal** — hoy se asume parcela = 0,1 ha; pendiente de confirmar tamaño real. *Responsable: Yurani.*
3. **Registro de siembra** (vs. medición) — sin esto, "individuos sembrados" queda en `s/d`.
4. **Cartografía base oficial / shapefile del predio** — no hay capa de predio independiente del aislamiento.
5. **Fotografías antes/después por parcela** — 0 cargadas en `fotografias`.

### 🌊 Vegetación Acuática
1. **Imágenes satelitales/dron por fecha de monitoreo** — el comparativo usa un esquema gráfico, no imágenes reales.
2. **Longitud real del borde intervenido** (hoy estimación de ~3,1 km).
3. **Volumen de biomasa retirada** — sin reportar.

### 🧪 Ficorremediación
1. **Resultados de laboratorio de calidad de agua** (15 parámetros: pH, OD, DBO5, SST, fósforo, nitrógeno, clorofila A, coliformes, cianotoxinas) — tabla `ficor_calidad_agua` creada, 0 filas.
2. **Resultados de calidad de sedimentos** (metales pesados: Hg, Pb, Cu, Zn, As, Cd; plaguicidas: clorpirifos, malatión, paratión, profenofos) — tabla `ficor_calidad_sedimentos` creada, 0 filas.
3. **Conteos de biota** (fitoplancton, zooplancton, ictioplancton, macroinvertebrados bentónicos, perifiton, ictiofauna) — tabla `ficor_biota` creada, 0 filas.
4. **Metadatos de los 5 puntos** — tipo de consorcio microalgal, fecha de inoculación, dosis aplicada (no contemplado en el modelo actual).
5. ✅ Resuelto desde el último avance: los 5 puntos georreferenciados ya están cargados en `puntos_monitoreo` y visibles por defecto en el geovisor.

### 🦜 Monitoreo de Fauna
1. **Definición de variables del tablero** — especies objetivo, grupos taxonómicos, esfuerzo de muestreo, índices a calcular. *Responsable: Darío.* Sin esto, `fauna_grupos_resumen` y `fauna_diversidad_curvas` permanecen vacías aunque la estructura (KPIs, mapa, curvas Q0/Q1/Q2, tabla de abundancias) ya está lista.
2. **Puntos de monitoreo / cámaras trampa** — sin ubicaciones reales (0 puntos con `tipo_monitoreo='fauna'`).

### 🤝 Gobernanza Ambiental
- ✅ Sin pendientes de carga — las 7 actividades, cantidades y participantes del Excel ya están en `gobernanza_actividades` y reflejadas en el dashboard transversal.
- 🟡 Pendiente menor: las ubicaciones "georreferenciada en la foto" (jornadas de limpieza, recorrido guiado) no tienen coordenadas reales asociadas.

### 📊 Transversal / modelo general
- Las tablas genéricas del modelo inicial (`monitoreos`, `parcelas`, `documentos`, `fotografias`, `indicadores_ambientales`) siguen vacías porque el dato real terminó modelándose en tablas específicas por componente (`arboles_monitoreo`, `puntos_monitoreo`, `*_grupos_resumen`, etc.). Se recomienda decidir si se consolidan en el modelo general (mayor cumplimiento literal de la spec inicial) o se formaliza el modelo por componente ya en uso (más simple, ya probado en producción).

---

## 5. Próximos pasos sugeridos

| Acción | Responsable | Bloquea a |
|---|---|---|
| Programar los 4 talleres de capacitación (obligación 5.7) | MC Consultorías + Dirección del Proyecto | Pago 30 % (3.3) y liquidación |
| Definir variables del tablero de Fauna | Darío | `fauna_grupos_resumen`, `fauna_diversidad_curvas` |
| Entregar resultados de laboratorio (agua/sedimentos) y conteos de biota | Equipo de ficorremediación | `ficor_calidad_agua`, `ficor_calidad_sedimentos`, `ficor_biota` |
| Completar campañas de Monitoreo 1-4 (censo forestal) | Yurani / equipo de campo | Indicadores reales de Restauración por fecha |
| Confirmar fórmula de densidad/área basal y tamaño de parcela | Yurani | KPIs de Restauración |
| Validar y firmar manuales técnico/usuario y diccionario de datos | Dirección del Proyecto | Entregable 5.8 |
| Consolidar informe formal de pruebas técnicas | MC Consultorías | Entregable 5.5 |
| Entregar/cargar cartografía base institucional oficial | Entidad / Dirección del Proyecto | Entregable 5.1 (d, e) |

---

*Informe generado a partir del estado real de la base de datos de producción (`geodatabase.mcconsultorias.com.co`) y del repositorio del proyecto al 24 de junio de 2026.*
