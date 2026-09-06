# Registro de incidencias y procedimiento de soporte

**Plataforma:** Geodatabase y geovisor de restauración ecológica — Ciénaga de Luruaco
**Contrato:** UTL-001 de 2026 · Unión Temporal Restauración Luruaco
**Entregable:** cláusula 5.6 — soporte y mantenimiento post-implementación, literales a) a d)
**Vigencia del soporte:** durante la ejecución del contrato **y un año más**

---

## 1. Acuerdo de nivel de servicio

| Concepto | Compromiso |
|---|---|
| Canal | Correo electrónico, desde el módulo **Soporte** de la plataforma |
| Acuse y primera respuesta | **Dentro de las 4 horas siguientes al envío** del mensaje |
| Alcance | Corrección de errores atribuibles al desarrollo y ajustes menores derivados del uso normal |
| Fuera de alcance | Nuevas funcionalidades, cambios de alcance y carga de información que no ha sido entregada |

El reporte se genera desde **Soporte**, en el panel lateral de la plataforma. El correo se
abre con los campos que se necesitan para atender el caso y añade automáticamente la
versión desplegada y el navegador del usuario, que es lo primero que se pregunta en
cualquier revisión.

---

## 2. Clasificación

| Severidad | Definición | Ejemplos | Atención |
|---|---|---|---|
| **Crítica** | La plataforma no está disponible o hay riesgo para la información | El sitio no responde; error al guardar registros de campo; pérdida de datos | Inmediata, hasta restablecer |
| **Alta** | Un componente no funciona y no hay forma de rodearlo | Un componente no carga; los reportes no se descargan; no se puede iniciar sesión | En la jornada |
| **Media** | Falla algo con alternativa disponible | Una capa no se dibuja; el visor 3D no carga en un equipo concreto | En la semana |
| **Baja** | Detalle de presentación o mejora menor | Texto desactualizado; ajuste de un rótulo | En la siguiente actualización |

---

## 3. Procedimiento

1. **Reporte.** El usuario escribe desde Soporte describiendo qué ocurrió, en qué
   componente y cómo reproducirlo.
2. **Acuse.** Se responde dentro de las 4 horas confirmando recepción y severidad asignada.
3. **Diagnóstico.** Se reproduce el caso y se revisan los registros del servicio:
   ```bash
   cd /opt/geovisor && docker compose -p geovisor -f docker-compose.vps.yml logs --tail=200 backend
   ```
4. **Corrección.** Se resuelve, se verifica y se publica siguiendo el procedimiento de
   actualización del [manual del administrador](E10_Manual_Administrador_Principal.md).
5. **Cierre.** Se informa al usuario qué se corrigió y se anota en el registro del apartado 5.

---

## 4. Antes de reportar

Buena parte de los casos se resuelven en el momento:

| Síntoma | Comprobación |
|---|---|
| «Token inválido o expirado» | La sesión dura 24 horas: vuelva a iniciar sesión |
| Un cambio publicado no se ve | Recargue forzando (Ctrl+F5 / ⇧+⌘+R): el navegador cachea con fuerza |
| Un componente muestra «sin dato» | No es un error: esa información aún no se ha cargado |
| No aparece «Registrar Monitoreo» | El rol es de consulta |
| El modelo 3D no carga | Pulse «Reintentar»; si persiste, reporte indicando el navegador |

---

## 5. Registro de incidencias

Se diligencia una fila por caso. El registro queda abierto con el inicio del soporte.

| N.º | Fecha de reporte | Reportado por | Componente | Descripción | Severidad | Estado | Fecha de cierre | Solución aplicada |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | *Sin incidencias reportadas a la fecha de este documento* | — | — | — | — |

**Estados:** `abierta` → `en diagnóstico` → `en corrección` → `verificando` → `cerrada`.
Una incidencia solo se cierra cuando quien la reportó confirma que quedó resuelta.

---

## 6. Antecedentes de corrección durante el desarrollo

Se dejan registrados los hallazgos corregidos antes de la entrega, por su valor para el
mantenimiento futuro:

| Hallazgo | Efecto | Corrección |
|---|---|---|
| Los puntos de la capa de técnicas no mostraban el nombre de la herramienta aplicada | El atributo existía pero no se presentaba en ninguna vista | El nombre encabeza la ficha del elemento y da color propio a cada polígono |
| El carrusel de gobernanza repartía el ancho entre todas las fotos | Con 25 fotos, cada una quedaba en 72 px | Cara de ancho fijo; la foto frontal pasa a ~494 px |
| El visor 3D no liberaba las texturas al cambiar de espécimen | La memoria de vídeo se agotaba y el contexto WebGL se perdía tras varios cambios | Se liberan geometría, materiales y texturas; el fallo dejó de ser permanente y hay reintento |
| El panel del copiloto quedaba por debajo del mapa | Ilegible sobre las vistas con geovisor | Reordenado por encima de las capas de Leaflet |
| Los composes no pasaban las variables del proveedor de IA al contenedor | La clave se habría configurado sin efecto y sin aviso | Declaradas con valor por defecto en ambos archivos |
| «Ajustes» y «Soporte» no tenían función | Dos accesos visibles sin comportamiento | Implementados |
| La página pública anunciaba cuatro componentes | La aplicación tiene seis; Fauna figuraba «en definición» teniendo ya su línea base | Corregida la descripción y los estados |

---

## 7. Registro de disponibilidad

Se recomienda un monitoreo externo del endpoint de salud, con aviso por correo ante caída:

```bash
curl -s https://geodatabase.mcconsultorias.com.co/health
```

Debe responder `{"status":"ok"}`. Servicios gratuitos como UptimeRobot cubren esta
comprobación cada cinco minutos sin costo.

---

## 8. Entrega del registro

Al cierre del periodo de soporte se entrega este documento diligenciado, con el
consolidado de incidencias atendidas, sus tiempos de respuesta y las correcciones
aplicadas, según lo previsto en el literal d) de la cláusula 5.6.
