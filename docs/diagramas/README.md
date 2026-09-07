# Diagramas de la plataforma

Tres diagramas interactivos que acompañan la documentación de entrega. Cada uno es un
**archivo HTML autónomo**: se abre con doble clic en cualquier navegador, sin instalar
nada y sin servidor.

| Diagrama | Qué muestra | Documento que acompaña |
|---|---|---|
| [arquitectura-aplicacion.html](arquitectura-aplicacion.html) | Cómo está desplegada la plataforma: contenedores, proxy con TLS, red interna y servicios externos | [E02 · Requerimientos y arquitectura](../E02_Requerimientos_Arquitectura_Roles.md) |
| [modelo-datos.html](modelo-datos.html) | El esquema `eco_restauracion`: tablas por dominio y cómo se relacionan | [E01 · Diccionario de datos](../E01_Diccionario_Datos_Principal.md) |
| [flujo-del-dato.html](flujo-del-dato.html) | El recorrido de la información desde el campo hasta la pantalla | [E06 · Informe de pruebas](../E06_Informe_Pruebas_Tecnicas.md) |

## Cómo se usan

Ábralos en el navegador. Cada diagrama trae:

- **Vistas guiadas** — recorridos que resaltan un camino concreto (consulta, captura en
  campo, copiloto, servicios externos). Útiles para presentar ante la interventoría.
- **Búsqueda y trazado de rutas** — localizar un componente y seguir sus conexiones.
- **Tema claro y oscuro** — se alterna con un clic.
- **Exportación** — PNG, SVG y tarjeta de 1200×630 para incluir en informes.

> Los diagramas usan la tipografía JetBrains Mono desde Google Fonts. Sin conexión se
> muestran igual, con la fuente monoespaciada del sistema.

## Cómo se regeneran

Los diagramas se compilan con [Archify](https://github.com/tt-a1i/archify) a partir de
los archivos JSON de `fuente/`, que son la definición editable. Para modificar uno, se
edita el JSON y se vuelve a compilar:

```bash
node archify/bin/archify.mjs render architecture docs/diagramas/fuente/arquitectura-aplicacion.architecture.json docs/diagramas/arquitectura-aplicacion.html
```

Antes de publicar conviene validar, porque Archify comprueba la composición —solapes de
etiquetas, rutas que siguen bordes, legibilidad a 1440 px— y no solo el esquema:

```bash
node archify/bin/archify.mjs validate architecture docs/diagramas/fuente/arquitectura-aplicacion.architecture.json
```

Los tres diagramas de esta carpeta pasan la validación en perfil `showcase` sin errores
ni advertencias.

## Fuentes de la información

El contenido no es ilustrativo: sale del sistema tal como está desplegado.

- Componentes, contenedores y red: `docker-compose.vps.yml` y la operación real del servidor
- Tablas y relaciones: migraciones de `04-base-de-datos/` (25 tablas, 10 vistas)
- Recorrido del dato: endpoints de `02-backend/` y las vistas del geovisor
- Salvedades declaradas (ficorremediación sin mediciones, campañas 1 a 4 pendientes):
  [INFORMACION-PENDIENTE-POR-COMPONENTE.md](../INFORMACION-PENDIENTE-POR-COMPONENTE.md)
