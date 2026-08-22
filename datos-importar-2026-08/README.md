# 📦 Nueva data — agosto 2026 (importación)

Data entregada en `nueva data/` convertida a formatos listos para la geodatabase.
Los **vectores** (GeoJSON, este folder) se versionan y se importan al backend; los
**rásters** (ortofotos `.tif`/`.kmz`, ~2 GB) NO van a git — se tilean en el servidor.

## 1. Vectores listos para importar (en este folder)

| Archivo | Contenido | Destino sugerido |
|---|---|---|
| `limpieza_maleza_2026.geojson` | 2 polígonos de limpieza de maleza (Enero 4.103 ha, Mayo) con `mes`/`capa`/`tipo` | capa `maleza_acuatica` (componente Maleza) |
| `fauna_herpetos.geojson` | 7 registros de herpetofauna (`Clase`, `Codigo`) | fauna / capa temática |
| `fauna_aves_camaras.geojson` | 7 puntos de aves y cámaras (`Tipo1`, `COD`) | fauna (`tipo_monitoreo=fauna`) |

### Cómo importar
Con el backend arriba, desde `scripts/`:

```bash
./import_ogr.sh ../datos-importar-2026-08/limpieza_maleza_2026.geojson maleza_acuatica
./import_ogr.sh ../datos-importar-2026-08/fauna_herpetos.geojson fauna_herpetos
./import_ogr.sh ../datos-importar-2026-08/fauna_aves_camaras.geojson fauna_aves_camaras
```

O por la app: **Descarga/administración → Importar** (sube el `.geojson`; rol admin/técnico).

### ⚠️ Notas de calidad de la data
- **Febrero (limpieza) llegó vacío**: `Poligono febrero.shp` no trae geometría (0 features).
  Falta re-exportar ese polígono; por eso el combinado solo tiene Enero y Mayo.
- **Herpetos** vienen como líneas (`MultiLineString`), no puntos — se cargan igual, pero
  confirmar si deberían ser puntos de observación.
- `Camaras 1er monitoreo.rar` no se procesó (archivo comprimido); descomprimir y revisar
  antes de integrar los datos de fototrampeo.

## 2. Rásters — ortofotos temporales (tilear en el servidor)

Origen en `nueva data/GDB/` (EPSG:4326, ~4 cm/px). Para el comparador ANTES/DESPUÉS:

| Archivo | Uso |
|---|---|
| `Enero Antes 4.103 ha.tif` / `Enero Despues.tif` | Comparación Enero |
| `Febrero antes 9.103 ha.tif` | Febrero (falta "después") |
| `Mayo Antes 9.162 ha.tif` | Mayo (falta "después") |
| `Ortofoto predio GDB.kmz` | Ortofoto de predio actualizada |

Tilear con `scripts/tile_ortofotos_temporales.sh` (ver ese archivo). Los tiles van a
`tiles/` (ignorado por git) y los sirve Nginx/Vite en `/tiles/...`.

- ⛔ **`Ortofoto ... Planta de Bioaumentación.kmz` NO se publica en el visor** (restricción
  del proyecto: no mostrar la Planta de bioaumentación).
