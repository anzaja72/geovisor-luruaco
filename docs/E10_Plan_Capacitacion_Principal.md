# Plan de capacitación

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Contrato:** UTL-001 de 2026 · Unión Temporal Restauración Luruaco
**Entregable:** cláusula 5.7 — *«Realizar cuatro (4) talleres de capacitación en el uso, administración y consulta de la Geodatabase y la plataforma digital»* y *«Entregar material de apoyo y memorias»*

---

## 1. Alcance

Cuatro talleres de dos horas cada uno, presenciales o virtuales, con práctica guiada
sobre la plataforma en producción. Cada taller se dicta sobre
**https://geodatabase.mcconsultorias.com.co** con cuentas reales del participante, no
sobre un entorno de demostración.

| Taller | Dirigido a | Duración |
|---|---|---|
| 1 · La geodatabase | Técnicos y administrador | 2 h |
| 2 · El geovisor | Todos los roles | 2 h |
| 3 · Captura de información y reportes | Técnicos | 2 h |
| 4 · Administración de la plataforma | Administrador | 2 h |

**Requisitos:** computador con navegador actualizado, conexión a internet y cuenta
creada previamente con el rol que corresponda.

---

## 2. Taller 1 · La geodatabase

*Técnicos y administrador*

- Qué guarda la plataforma: las 25 tablas del esquema `eco_restauracion` agrupadas por
  componente, y las 10 vistas de cálculo.
- Sistemas de referencia: por qué todo se almacena en EPSG:4326 y qué pasa con los datos
  del dron, que llegan en MAGNA-SIRGAS.
- Cómo se relacionan los datos: la cadena predio → parcela → medición, y por qué el censo
  forestal se enlaza a la parcela por su nomenclatura (BD1, DD4…).
- El catálogo de productos del levantamiento con dron.

**Práctica:** conectar QGIS a la geodatabase y cargar dos capas; localizar una parcela por
su nomenclatura y revisar sus atributos.

**Material:** [diccionario de datos](E01_Diccionario_Datos_Principal.md) ·
[modelo de datos interactivo](diagramas/modelo-datos.html) ·
[metadatos ISO 19115](E03_Metadatos_ISO19115.md)

---

## 3. Taller 2 · El geovisor

*Todos los roles*

- Ingreso, roles y qué habilita cada uno.
- Recorrido por los seis componentes y qué responde cada uno.
- El mapa: capas, ortofoto del dron, capas oficiales del IGAC, consulta por clic,
  búsqueda y medición de distancias y áreas.
- Trazabilidad temporal: campañas de monitoreo y comparador antes/después.
- El visor 3D de fauna y el registro fotográfico de gobernanza.
- El copiloto: cómo preguntar y cómo leer la fuente que cita cada respuesta.

**Práctica:** localizar la parcela DD4 y leer su ficha; filtrar el mapa por una cobertura;
medir el borde intervenido de la laguna; preguntar al copiloto por el área restaurada y
comprobar el dato en el componente que indica.

**Material:** [manual de usuario](E10_Manual_Usuario_Principal.md) ·
[arquitectura de la plataforma](diagramas/arquitectura-aplicacion.html)

---

## 4. Taller 3 · Captura de información y reportes

*Técnicos*

- El formulario de registro de cada componente y qué campos son obligatorios.
- Qué ocurre cuando no hay señal en campo: el registro queda en el dispositivo y se envía
  al recuperar conexión.
- Cómo se refleja lo registrado: de la base al indicador en pantalla.
- Módulo de descarga: los cinco reportes en CSV, Excel y PDF.
- Lectura correcta de un indicador: qué significa «sin mediciones registradas» y por qué
  no se muestra como cero.

**Práctica:** registrar una actividad de gobernanza y comprobar que los indicadores
cambian; descargar el reporte de coberturas en Excel y el consolidado en PDF.

**Material:** [manual de usuario](E10_Manual_Usuario_Principal.md) ·
[recorrido del dato](diagramas/flujo-del-dato.html)

---

## 5. Taller 4 · Administración de la plataforma

*Administrador*

- Gestión de cuentas: alta, cambio de rol, desactivación y restablecimiento de contraseñas.
- Carga masiva: importación de GeoJSON y CSV desde el visor; shapefile y GeoTIFF en el servidor.
- Actualización de la plataforma y aplicación de migraciones.
- Respaldos: copia manual, tarea programada y prueba de restauración.
- Atención de incidencias y acuerdo de nivel de servicio.
- Configuración del proveedor del copiloto y control de su consumo.

**Práctica:** crear un usuario con rol técnico y verificar sus permisos; ejecutar un
respaldo y restaurarlo en una base de prueba; revisar los registros del servicio.

**Material:** [manual del administrador](E10_Manual_Administrador_Principal.md) ·
[registro de incidencias](E08_Registro_Incidencias.md) ·
[10-INFRAESTRUCTURA-PRODUCCION.md](../10-INFRAESTRUCTURA-PRODUCCION.md)

---

## 6. Material de apoyo

Se entrega a cada participante:

- Los manuales de usuario y de administrador según su rol.
- Los tres diagramas interactivos, que se abren en cualquier navegador.
- Una guía rápida de una página con los pasos de su labor habitual.
- La presentación empleada en el taller.

---

## 7. Memorias y evidencias

De cada taller se levanta:

| Evidencia | Contenido |
|---|---|
| Acta | Fecha, lugar o enlace, duración, temario cubierto y compromisos |
| Lista de asistencia | Nombre, entidad, rol y firma o registro de conexión |
| Registro fotográfico | O captura de la sesión, si es virtual |
| Ejercicios resueltos | Resultado de la práctica de cada participante |

Las actas se cargan en la geodatabase, en la tabla `documentos` con tipo `acta`, de modo
que la evidencia quede en la misma plataforma sobre la que se capacitó.

---

## 8. Estado de ejecución

| Taller | Fecha programada | Fecha ejecutada | Asistentes | Acta |
|---|---|---|---|---|
| 1 · La geodatabase | Por programar | — | — | — |
| 2 · El geovisor | Por programar | — | — | — |
| 3 · Captura y reportes | Por programar | — | — | — |
| 4 · Administración | Por programar | — | — | — |

La programación depende de la disponibilidad de la Dirección del Proyecto y del personal
técnico de la entidad. Este cuadro se diligencia a medida que se ejecuten los talleres y
acompaña la entrega final del contrato.
