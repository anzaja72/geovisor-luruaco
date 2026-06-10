# 📖 Manual de Usuario — Geovisor Luruaco

**Rol objetivo:** usuarios de *consulta* (y base común para técnico/administrador).

## 1. Ingreso
1. Abra la URL del geovisor en su navegador.
2. Ingrese su **correo** y **contraseña** (entregados por el administrador).
3. Su rol determina lo que puede hacer: *consulta* (ver), *técnico* (cargar/editar), *administrador* (todo).

## 2. Pantalla principal
- **Cabecera:** escala de calificación del índice (Pésima → Óptima), su usuario y botón **Salir**.
- **Pestañas:** Escala departamental (tablero principal) · **Descarga de datos** (reportes).
- **Selector de periodo** (arriba a la derecha): cambia todo el tablero al periodo elegido.

## 3. Panel izquierdo
- **Buscar sitio por nombre:** filtra el listado.
- **Filtros:** por *categoría de calidad* y *tipo de ecosistema* — afectan mapa, listado y gráficas. «Limpiar» los restablece.
- **Listado de sitios:** clic en un sitio → el mapa vuela a él.

## 4. Mapa
- **Capas** (control superior derecho): active/desactive mapas base (Satélite/Océano/Calles) y capas de datos (Zonas, Lotes, Puntos de control, capas importadas como *curvas_nivel*).
- **Consulta por clic:** clic en un polígono o punto → ficha con código, tipo, área, estado e indicadores.
- **Buscar lugar:** caja sobre el mapa; escriba un sitio (ej. "Luruaco") y el mapa volará allí.
- **Medición:** botones 📏 (distancia) y ⬠ (área). Haga clics sucesivos en el mapa; el resultado aparece junto a los botones (✕ borra). Vuelva a pulsar el botón para salir del modo medición.
- **Comparar periodos:** pestaña bajo el mapa → dos mapas sincronizados **ANTES / DESPUÉS**, cada uno con su periodo.

## 5. Indicadores y gráficas
- **KPIs:** sitios visitados y con índice reportado.
- **Dona:** proporción de sitios por categoría de calidad.
- **Barras:** cantidad de sitios por categoría.

## 6. Descarga de datos (reportes)
Pestaña **Descarga de datos** → elija el reporte (áreas, coberturas Corine, monitoreos, indicadores, insumos dron) y el formato **CSV**, **Excel** o **PDF**. El archivo se descarga al instante.

## 7. Problemas frecuentes
| Síntoma | Solución |
|---|---|
| "Token inválido o expirado" | Vuelva a iniciar sesión (la sesión dura 24 h). |
| No ve el botón "Importar datos" | Su rol es *consulta*; solicite rol técnico al administrador. |
| El mapa no muestra una capa | Verifique el control de capas (esquina superior derecha). |
