# Lineamientos gráficos y de experiencia de usuario

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Entregable:** cláusula 5.3, literales a) a d) — arquitectura de experiencia, wireframes, diseño adaptable y lineamientos gráficos
**Base normativa:** Manual de Identidad Visual de la Corporación Autónoma Regional del Atlántico, ajustado a la Ley 2345 de 2023

---

## 1. Principio rector

La plataforma es un instrumento de una autoridad ambiental, no un producto comercial. El
diseño se subordina a dos cosas: **la identidad institucional de la C.R.A.** y **la lectura
correcta del dato**. Cuando ambas entran en conflicto con una preferencia estética, mandan
ellas.

De ahí se derivan tres reglas que atraviesan todo el documento:

1. Ningún color decorativo compite con el color que codifica información.
2. Un dato ausente se muestra como ausente; nunca como cero.
3. Toda cifra en pantalla puede rastrearse hasta su tabla de origen.

---

## 2. Identidad institucional

### 2.1 Colores de marca

| Color | Pantone | CMYK | RGB | HEX |
|---|---|---|---|---|
| Azul | 7691 C | 100/43/0/30 | 0 98 152 | `#005F96` |
| Cian | 638 C | 86/0/9/0 | 0 175 215 | `#00B5D9` |
| Verde | 375 C | 46/0/90/0 | 151 215 0 | `#8FD400` |
| Ámbar | 7408 | 0/29/100/0 | 246 190 0 | `#EDB512` |
| Gris | — | 0/0/0/50 | 157 157 156 | `#969491` |

### 2.2 Uso del color en pantalla

El verde y el ámbar institucionales rinden **1,8:1 sobre blanco**, muy por debajo del
mínimo de accesibilidad para texto. Por eso se distinguen dos usos:

| Uso | Colores |
|---|---|
| Rellenos, gráficas, mapas y estados | Colores de marca puros |
| Tipografía, iconos y trazos sobre fondo claro | Azul institucional o variantes oscurecidas del mismo matiz |

Variantes derivadas para texto: verde `#4d7a00` (5,1:1), ámbar `#8a6a00` (5,1:1),
cian `#00738c`. El azul institucional rinde 6,8:1 y se usa sin modificar.

Todos los pares texto/fondo de la interfaz alcanzan **AA** o mejor.

### 2.3 Tipografía

**Lato**, en los pesos 400, 700 y 900. Es la fuente que el manual define para web; Gotham
y Century Gothic quedan reservadas a impresos.

| Uso | Tamaño | Peso |
|---|---|---|
| Cifra de indicador | 22–34 px | 800 |
| Título de sección | 13–16 px | 700 |
| Texto corriente | 12,5–13,5 px | 400 |
| Etiqueta de campo | 10,5–11 px | 700, versalitas |
| Nota al pie y fuente | 10–11 px | 400 |

### 2.4 Uso del isologo

Reglas tomadas del manual y aplicadas en la plataforma:

- **Tamaño mínimo:** 1,5 cm de ancho (≈57 px). En la barra superior se usa a 60 px y en el
  pie de la página pública a 64 px.
- **Área de reserva:** ningún texto, línea o elemento gráfico la invade.
- **Versión a color** sobre fondo claro; **versión en negativo** (blanco) sobre fondo de
  color, como en el pie de la página pública y en la cabecera sobre el vídeo.
- **Prohibido:** deformarlo, recolocar sus elementos, cambiarle los colores o situarlo
  directamente sobre una fotografía.

Archivos: `logo-cra.svg` (color) y `logo-cra-negativo.svg` (negativo), ambos vectoriales.

> **Salvedad documentada.** En la cabecera de la página pública el fondo es transparente
> sobre el vídeo, por decisión sobre el diseño de esa página. La legibilidad se sostiene
> con un velo oscuro degradado. Devolver a la barra un plano de color institucional es un
> cambio de una línea si la Dirección del Proyecto lo prefiere.

---

## 3. Arquitectura de la experiencia

### 3.1 Estructura

Todas las vistas siguen el mismo orden, para que el usuario no tenga que reaprender la
pantalla al cambiar de componente:

```
┌──────────────────────────────────────────────────────────┐
│ Barra superior · isologo · pregunta al copiloto · sesión │
├───────────────┬──────────────────────────────────────────┤
│ Componentes   │  Filtros de la vista (si aplica)         │
│ (6)           ├──────────────────────────────────────────┤
│               │  Indicadores                             │
│ Herramientas  ├──────────────────────────────────────────┤
│               │  Mapa o visor                            │
│ Registrar     ├──────────────────────────────────────────┤
│ Importar      │  Gráficas y tablas                       │
│ Ajustes       ├──────────────────────────────────────────┤
│ Soporte       │  Nota metodológica y fuentes             │
└───────────────┴──────────────────────────────────────────┘
```

### 3.2 Jerarquía de lectura

1. **Qué se logró** — los indicadores, arriba y en cifra grande.
2. **Dónde ocurrió** — el mapa o el visor.
3. **Cómo se distribuye** — gráficas y tablas.
4. **De dónde sale** — nota metodológica con fórmulas, fuentes y supuestos.

### 3.3 Prototipo navegable

Los prototipos de las vistas, elaborados antes del desarrollo, se conservan en
`03-frontend/public/mockup/` y siguen siendo navegables. Permiten contrastar lo entregado
con lo diseñado.

---

## 4. Componentes de interfaz

| Componente | Uso | Reglas |
|---|---|---|
| Tarjeta de indicador | Cifra principal de un componente | Etiqueta en versalitas, cifra en 800, unidad en tamaño menor. Si es pulsable, lleva ⓘ |
| Panel | Agrupa mapa, gráfica o tabla | Fondo blanco, borde `#e4e8ee`, radio 12 px, cabecera con icono y título |
| Distintivo de estado | Origen o vigencia del dato | Verde: datos en vivo · Ámbar: pendiente o de muestra · Gris: sin definir |
| Ficha emergente del mapa | Atributos de un elemento | Título, distintivo de tipo, pares campo/valor y descripción |
| Modal | Formularios y ayudas | Cabecera azul institucional, cierre visible, cierre por clic exterior y Escape |
| Panel lateral | Copiloto | Se desliza desde la derecha sin tapar el mapa |

### 4.1 Color con significado

| Escala | Uso | Colores |
|---|---|---|
| Coberturas Corine | Capas del mapa | Paleta temática por clase: mosaico, bosque denso, galería, vegetación secundaria, tierras desnudas |
| Series de datos | Gráficas de abundancia y actividades | Paleta derivada de los colores institucionales (`lib/marca.ts`) |
| Estados | Distintivos y avisos | Verde, ámbar y gris institucionales |

Los colores de las coberturas **no se alteran por estética**: identifican clases y deben
mantenerse estables entre vistas y salidas gráficas.

---

## 5. Diseño adaptable

| Ancho | Comportamiento |
|---|---|
| ≥ 1180 px | Tres columnas donde aplique; panel lateral fijo |
| 768–1180 px | Los bloques de tres columnas pasan a una; el visor 3D ocupa el ancho completo |
| < 768 px | Una sola columna; el panel lateral se pliega |

Las tablas anchas y los bloques de código se desplazan dentro de su contenedor: **la
página nunca se desplaza horizontalmente**.

---

## 6. Accesibilidad

- Contraste **AA** o superior en todo texto (verificado par por par).
- Todo control tiene nombre accesible (`aria-label` o texto visible).
- Los modales se cierran con Escape y devuelven el foco.
- El idioma del documento está declarado como español.
- El color nunca es el único portador de significado: siempre lo acompaña un texto.
- El visor 3D degrada a la lámina fotográfica del grupo cuando el equipo no soporta WebGL.

---

## 7. Redacción en pantalla

| Situación | Cómo se dice | Cómo no |
|---|---|---|
| Dato no levantado | «Sin mediciones registradas para esta fecha» | «0» |
| Componente en captura | «Estructura lista · datos en captura» | «Próximamente» |
| Origen del dato | «Fuente: censo arboles_monitoreo» | Sin indicar procedencia |
| Supuesto de cálculo | «Supuesto: parcela = 0,1 ha; confirmar» | Ocultarlo |
| Respuesta del copiloto | «Generada con inteligencia artificial… verifique con la Dirección del Proyecto» | Presentarla como dato oficial |

Se escribe en español, con unidades del sistema métrico, separador decimal de coma y de
miles de punto (`41,72 ha`, `17.565 plántulas`).

---

## 8. Dónde vive cada cosa

| Elemento | Archivo |
|---|---|
| Variables de color y tipografía | `03-frontend/src/styles/geovisor.css` |
| Colores de marca para gráficas y mapas | `03-frontend/src/lib/marca.ts` |
| Estilos del tablero y las fichas | `03-frontend/src/styles/dashboard.css` |
| Isologo institucional | `03-frontend/public/logo-cra.svg` y `logo-cra-negativo.svg` |
| Prototipos navegables | `03-frontend/public/mockup/` |

Cualquier ajuste de identidad se hace sobre las variables, no sobre cada componente: así
un cambio de la entidad se propaga a toda la plataforma sin reescribir vistas.
