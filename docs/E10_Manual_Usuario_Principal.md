# Manual de usuario — Geovisor de Restauración Ecológica

**Plataforma:** Geodatabase y geovisor de la Ciénaga de Luruaco
**Entidad:** Corporación Autónoma Regional del Atlántico — C.R.A. · Contrato 324 de 2025
**Dirigido a:** usuarios de consulta, técnicos y administradores
**Dirección:** https://geodatabase.mcconsultorias.com.co

---

## 1. Ingreso

Abra la dirección en su navegador. La página de inicio presenta el proyecto; el botón
**Ingresar a la plataforma** lleva al acceso.

Escriba el correo y la contraseña que le entregó el administrador. La sesión dura
**24 horas**; pasado ese tiempo el sistema le pedirá entrar de nuevo.

Su rol determina lo que puede hacer:

| Rol | Puede |
|---|---|
| Consulta | Ver los componentes y sus indicadores. No descarga información ni registra datos |
| Técnico | Todo lo anterior, más descargar reportes, registrar monitoreos e importar capas |
| Administrador | Todo, incluida la administración de cuentas |

**¿No tiene cuenta?** En la página de inicio, la pestaña **Crear cuenta** abre una de
consulta al instante. Para registrar información en campo, solicite el rol de técnico
al administrador.

---

## 2. Cómo está organizada la pantalla

**Barra superior.** El isologo de la C.R.A., la caja de preguntas al copiloto, y a la
derecha los accesos a notificaciones, su cuenta y salir.

**Panel lateral izquierdo.** Los seis componentes del proyecto y, debajo, las
herramientas:

- Restauración Ecológica
- Vegetación Acuática
- Ficorremediación
- Monitoreo de Fauna
- Gobernanza Ambiental
- Dashboard Transversal

Y, según su rol, las herramientas: **Descarga de Datos** (técnico y administrador) y
**Administración de cuentas** (solo administrador).

Al pie del panel: **Registrar Monitoreo** e **Importar datos** —que aparecen si su rol
los permite—, **Ajustes** y **Soporte**.

**Área central.** Cambia según el componente elegido. Todos siguen el mismo orden:
indicadores arriba, mapa o visor en el medio, gráficas y tablas debajo.

---

## 3. Los componentes

### 3.1 Restauración Ecológica

Arriba, dos selectores gobiernan toda la vista:

- **Línea de tiempo** — campaña de monitoreo: Línea base (julio 2026), Monitoreo 1
  (noviembre 2026) y los siguientes. Si una campaña aún no tiene mediciones de campo, la
  vista lo indica en lugar de mostrar ceros engañosos.
- **Cobertura en el mapa** — deja visible una sola clase Corine; al elegirla, los
  indicadores del censo se recalculan solo para esa cobertura.

Los indicadores son riqueza de especies, densidad por hectárea, área basal por hectárea,
restauración activa, restauración pasiva e individuos sembrados. **Las tarjetas con el
símbolo ⓘ se pueden pulsar** y abren la explicación del dato.

A la derecha, el resumen de coberturas: al pulsar una fila, el mapa deja visible solo esa.

Debajo del mapa: densidad por parcela, riqueza por parcela y abundancia por especie.

### 3.2 Vegetación Acuática

El mapa abre sobre el borde de la ciénaga, con las ortofotos del dron posteriores a cada
limpieza —enero, febrero, mayo, junio y julio— y los polígonos intervenidos. **La línea de
tiempo lleva el mapa al área limpiada ese mes.** Arriba, las hectáreas removidas
acumuladas (40,247 ha a julio de 2026) y su evolución mes a mes.

Debajo, el comparador **antes / después** muestra lado a lado la ortofoto previa y la
posterior a la limpieza. Cada una se puede descargar como salida gráfica en PDF.

### 3.3 Ficorremediación

Tablero de calidad del agua de los cinco puntos de muestreo, con el **Índice de Calidad
del Agua (ICA) del IDEAM**:

- **Escala de calificación** en cinco categorías, de *pésima* a *óptima*, siempre visible.
- **Medidor de 0 a 100** con el valor del índice para el punto y la campaña elegidos.
- **Ficha del punto**: cada variable con su valor y su categoría en color. Las flechas
  pasan de un punto a otro.
- **Comportamiento histórico** de cada variable a lo largo de las campañas.
- **Resultados por matriz**: agua, sedimentos —calificados con las guías CCME para
  sedimento de agua dulce— y biota, presentada como riqueza y abundancia por grupo.
- Ortofoto del **laboratorio de microalgas** con su área de interés.

> **Mientras el laboratorio no entregue resultados, lo que se ve son datos de
> demostración**, y la pantalla lo advierte en un recuadro. Sirven para conocer el
> tablero; no son mediciones y no deben citarse como tales.

### 3.4 Monitoreo de Fauna

Abre con los **especímenes 3D** de la línea base: elija un grupo en la columna izquierda
(aves, mamíferos, anfibios, reptiles) y el modelo aparece en el centro.

- Arrastre para girarlo, use la rueda para acercar.
- Los botones de la esquina pausan el giro y reencuadran.
- En la ficha del grupo, los botones de colores son sus especies emblemáticas; pase el
  cursor por encima para leer su descripción.

A la derecha, la ficha del grupo: riqueza, registros, coberturas donde aparece y rol
ecológico. Debajo, el mapa de puntos de monitoreo —cada uno rotulado con su grupo y su
número de punto de muestreo— con su leyenda, el resumen de abundancias, la curva de
riqueza de especies y los registros, agrupados por grupo y filtrables por columna.

Los 119 registros actuales son los **preliminares** del anexo de fauna de línea base.

### 3.5 Gobernanza Ambiental

Eventos realizados, participantes y su distribución por tipo de actividad. Al final, el
registro fotográfico: **arrastre para girar el carrusel y pulse una foto para ampliarla**;
cada una indica a qué actividad corresponde. Con la foto ampliada, las flechas ‹ › —o las
teclas ← →— pasan a la siguiente sin cerrarla, y Esc la cierra.

### 3.6 Dashboard Transversal

Consolidado del avance de todos los componentes, para el seguimiento de los indicadores
contractuales.

---

## 4. El mapa

Presente en Restauración, Vegetación Acuática, Ficorremediación y Fauna.

- **Capas** (control superior derecho): mapas base, ortofoto del dron, capas del
  componente y capas oficiales del IGAC (catastro, pendientes, agrología).
- **Consulta:** pulse un elemento y se abre su ficha. En las parcelas incluye la
  nomenclatura (BD1, DD4…) y la cobertura; en las técnicas, el nombre de la herramienta
  de manejo aplicada.
- **Buscar lugar:** caja sobre el mapa; escriba un sitio y el mapa vuela allí.
- **Medición:** los botones de regla y polígono miden distancia y área. Pulse sucesivamente
  sobre el mapa; el resultado aparece junto a los botones. Vuelva a pulsar el botón para salir.
- **Descargar GeoJSON:** exporta las capas visibles del componente.

---

## 5. Preguntar al copiloto

La caja **«Pregunta sobre el proyecto…»** de la barra superior —o el atajo **⌘K / Ctrl+K**—
abre el asistente. Responde con las cifras cargadas en la plataforma, indica de qué tabla
salen y ofrece el acceso directo al componente donde verlas.

Si un dato todavía no se ha levantado en campo, lo dice; no lo estima.

> Las respuestas se generan con inteligencia artificial a partir de los datos de la
> plataforma. Verifique con la Dirección del Proyecto antes de usarlas como soporte técnico.

---

## 6. Descargar información

**Descarga de Datos**, en el panel lateral *(disponible para técnico y administrador)*.
Cinco reportes —áreas de intervención,
coberturas Corine, histórico de monitoreos, consolidado de indicadores y catálogo de
insumos dron— en **CSV**, **Excel** o **PDF**. El archivo se descarga de inmediato.

---

## 7. Registrar monitoreos *(técnico y administrador)*

Botón **Registrar Monitoreo** del panel lateral. El formulario cambia según el componente
en el que esté: censo de árboles, observación de fauna, medición de ficorremediación,
actividad de gobernanza o jornada de limpieza.

Complete los campos y guarde; el responsable queda registrado con su usuario. **Si en ese
momento no hay conexión, el registro se guarda en el navegador y se envía solo cuando
vuelva internet.**

---

## 8. Ajustes de su cuenta

**Ajustes**, al pie del panel lateral: muestra su nombre, correo y rol, y permite cambiar
su contraseña (mínimo ocho caracteres). El administrador ve además las cuentas con acceso.

---

## 9. Soporte

**Soporte**, al pie del panel lateral.

> Las solicitudes se atienden por correo electrónico y se responden **dentro de las 4 horas
> siguientes al envío** del mensaje.

El botón de reporte abre el correo con los campos que se necesitan para revisar el caso
—qué ocurrió, en qué componente, cómo reproducirlo— y añade automáticamente la versión de
la plataforma y su navegador.

---

## 10. Problemas frecuentes

| Síntoma | Qué hacer |
|---|---|
| «Token inválido o expirado» | Vuelva a iniciar sesión: la sesión dura 24 horas. |
| «Demasiados intentos fallidos» | Tras 10 intentos erróneos, el acceso desde su red se bloquea 15 minutos. Espere, o pida al administrador que le restablezca la contraseña. |
| «Cuenta desactivada o inexistente» | El administrador desactivó su cuenta. Consulte con él. |
| No aparece «Registrar Monitoreo», «Importar datos» ni «Descarga de Datos» | Su rol es de consulta; solicite el cambio al administrador. |
| Faltan puntos de fauna en el mapa | Las ubicaciones de cámaras trampa y transectos no se entregan al rol de consulta. |
| Una capa no se ve en el mapa | Revise el control de capas, arriba a la derecha. |
| La vista dice «sin mediciones registradas» | Esa campaña aún no tiene datos de campo; no es un error. |
| Un componente muestra «sin dato» | La información todavía no ha sido entregada por el equipo técnico. |
| Cambió algo y sigue viéndolo igual | Recargue forzando: Ctrl+F5 en Windows, ⇧+⌘+R en Mac. |
| El modelo 3D no carga | Pulse «Reintentar»; si persiste, repórtelo indicando su navegador. |
