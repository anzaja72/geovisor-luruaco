# Documentos históricos

Corresponden a alternativas de despliegue que se evaluaron durante el desarrollo y que
**no describen la plataforma en operación**. Se conservan como antecedente del proyecto.

| Documento | Por qué no aplica |
|---|---|
| `GUIA-DESPLIEGUE-NETLIFY.md` | La plataforma no está publicada en Netlify |
| `DESPLIEGUE-HOSTINGER.md` | Corresponde a una infraestructura anterior |

El despliegue vigente —VPS con Docker Compose, Traefik y PostGIS— está descrito en el
[manual del administrador](../E10_Manual_Administrador_Principal.md) y en
[10-INFRAESTRUCTURA-PRODUCCION.md](../../10-INFRAESTRUCTURA-PRODUCCION.md).

Tampoco se usa **Supabase**: las cuentas y contraseñas viven en la tabla `usuarios` de la
propia geodatabase, con bcrypt y tokens firmados por el backend. Las menciones que
aparecen en documentos antiguos corresponden a opciones descartadas.
