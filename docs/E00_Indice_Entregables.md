# Índice de entregables documentales

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Contrato:** UTL-001 de 2026 · Unión Temporal Restauración Luruaco
**Contratista:** MC Consultorías & Capacitación S.A.S.
**Actualizado:** 7 de septiembre de 2026

Este índice relaciona cada obligación documental de la cláusula quinta con el documento
que la sustenta.

---

## Documentos técnicos

| Documento | Contenido | Cláusula |
|---|---|---|
| [E01 · Diccionario de datos](E01_Diccionario_Datos_Principal.md) | Las 25 tablas y 10 vistas del esquema `eco_restauracion`, con sus campos, relaciones y sistemas de referencia | 5.1 a–d |
| [E02 · Requerimientos, arquitectura y roles](E02_Requerimientos_Arquitectura_Roles.md) | Requerimientos funcionales y no funcionales, diagrama de arquitectura, flujos y esquema de permisos | 5.2 a–e |
| [E03 · Metadatos ISO 19115](E03_Metadatos_ISO19115.md) | Catálogo de metadatos del conjunto y de cada capa: linaje, extensión, exactitud y restricciones | 5.1 f |
| [E04 · Lineamientos gráficos](E04_Lineamientos_Graficos.md) | Identidad institucional aplicada, componentes de interfaz, diseño adaptable y accesibilidad | 5.3 a–d |
| [E05 · Especificación de la API](E05_API_OpenAPI.yaml) | Las 40 operaciones de la API en OpenAPI 3.0, con seguridad, roles y esquemas | 5.4 c |
| [E06 · Informe de pruebas técnicas](E06_Informe_Pruebas_Tecnicas.md) | 52 casos ejecutados en producción: servicios, control de acceso, interfaz y entorno | 5.5 d |
| [E07 · Acta de entrega](E07_Acta_Entrega.md) | Relación de productos entregados, verificación sugerida, constancias y firmas | 5.8 |
| [E08 · Registro de incidencias](E08_Registro_Incidencias.md) | Acuerdo de nivel de servicio, clasificación, procedimiento y registro | 5.6 a–d |
| [E09 · Informe de entrega de productos](E09_Informe_Entrega_Productos.md) | Sustento del hito 3.3: qué está en operación, cumplimiento cláusula por cláusula y salvedades | 3.3 · 5.8 |
| [Diagramas interactivos](diagramas/README.md) | Arquitectura desplegada, modelo de datos y recorrido de la información, en HTML autónomo | 5.2 e · 5.1 |

## Manuales

| Documento | Dirigido a | Cláusula |
|---|---|---|
| [E10 · Manual de usuario](E10_Manual_Usuario_Principal.md) | Consulta, técnicos y administradores | 5.8 a |
| [E10 · Manual del administrador](E10_Manual_Administrador_Principal.md) | Responsable de la plataforma | 5.8 a, c |
| [E10 · Plan de capacitación](E10_Plan_Capacitacion_Principal.md) | Dirección del proyecto | 5.7 |

## Documentación de proyecto (raíz del repositorio)

| Documento | Contenido |
|---|---|
| [01-ARQUITECTURA.md](../01-ARQUITECTURA.md) | Visión técnica general |
| [02-BASE-DE-DATOS.md](../02-BASE-DE-DATOS.md) · [03-BACKEND.md](../03-BACKEND.md) · [04-FRONTEND.md](../04-FRONTEND.md) | Notas por capa |
| [05-DATOS-ESPACIALES.md](../05-DATOS-ESPACIALES.md) | Insumos del levantamiento con dron |
| [06-DESPLIEGUE.md](../06-DESPLIEGUE.md) · [10-INFRAESTRUCTURA-PRODUCCION.md](../10-INFRAESTRUCTURA-PRODUCCION.md) | Publicación y operación |
| [09-CAMBIOS.md](../09-CAMBIOS.md) | Bitácora de cambios |
| [INFORMACION-PENDIENTE-POR-COMPONENTE.md](INFORMACION-PENDIENTE-POR-COMPONENTE.md) | Información de campo pendiente de entrega |

---

## Estado frente a la cláusula quinta

| Obligación | Estado |
|---|---|
| 5.1 · Diseño y construcción de la geodatabase | Cumplida — E01, E03 |
| 5.2 · Análisis funcional y arquitectura | Cumplida — E02 |
| 5.3 · Diseño UX/UI | Cumplida — E04 y prototipos navegables |
| 5.4 · Desarrollo tecnológico | Cumplida — plataforma en producción; API en E05 |
| 5.5 · Pruebas, implementación y puesta en operación | Cumplida — E06 y URL operativa |
| 5.6 · Soporte y mantenimiento | En ejecución — E08 (registro abierto) |
| 5.7 · Capacitación | **Pendiente** — cuatro talleres y sus memorias |
| 5.8 · Entregables y documentación | Cumplida — este índice, los manuales, el repositorio, el informe de entrega (E09) y el acta (E07) |

### Salvedades que constan en los documentos

1. **Información de campo pendiente.** Las tablas `monitoreos`, `fotografias` y de
   validación están construidas y operativas, pero sin registros; el componente de
   ficorremediación carece de mediciones. La plataforma las representa como «sin dato».
   No es una obligación pendiente del contratista: depende de la entrega de esa
   información por los equipos técnicos del proyecto.

2. **Copias de seguridad.** El despliegue en operación no incluye un servicio de respaldo
   automático; el procedimiento manual y la tarea programada están en el manual del
   administrador.

3. **Copiloto del geovisor.** Es un desarrollo adicional que no figura en la cláusula
   quinta. Se documenta con el resto de la plataforma, dejando constancia de que su
   inclusión en el soporte del literal 5.6 debe acordarse expresamente.
