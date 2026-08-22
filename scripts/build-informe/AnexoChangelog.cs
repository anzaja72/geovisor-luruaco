using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class AnexoChangelog
{
    private const string Navy = "1F3A5F";
    private const string Teal = "2E8B8B";
    private const string SoftBlack = "333333";
    private const string Green = "16A34A";
    private const string Yellow = "EAB308";
    private const string Red = "DC2626";
    private const string Gray = "6B7280";
    private const string ZebraLight = "F8FAFC";
    private const string HeaderFill = "1F3A5F";
    private const string CaptionGray = "595959";

    // Commit data extracted from `git log --pretty=format:"%h | %ad | %s" --date=short`
    private static readonly (string hash, string date, string type, string scope, string subject, string[] details)[] Commits = new[]
    {
        ("bc573fa", "2026-06-19", "feat", "landing", "video de muestra en el hero (reemplaza la imagen)", new[] {
            "Reemplaza la imagen estática del hero de la landing institucional por un video de muestra del visor en funcionamiento.",
            "Mejora la primera impresión y el engagement del visitante institucional.",
        }),
        ("1c58869", "2026-06-19", "feat", "landing", "landing institucional responsive propia", new[] {
            "Nueva página de aterrizaje responsive (mobile-first) con identidad institucional C.R.A.",
            "Integra el botón de acceso al visor y la sección de componentes.",
        }),
        ("36a488e", "2026-06-18", "fix", "responsive", "el visor se ve correctamente en móvil", new[] {
            "Correcciones de CSS y breakpoints para que el visor Leaflet se renderice correctamente en pantallas pequeñas.",
            "Sidebar colapsable, grillas adaptables y popups optimizados para touch.",
        }),
        ("2d551f6", "2026-06-17", "feat", "infra", "landing Claude, puntos GPS, curvas fuera, healthcheck, deploy VPS", new[] {
            "Punto GPS real GPS1 de PC Luruaco.csv (reproyectado de EPSG:9377 a WGS84 → -75.170943, 10.606029).",
            "Curvas de nivel separadas del visor (mejoran el rendimiento del mapa principal).",
            "Endpoint /health robusto en el backend.",
            "Pipeline de despliegue en VPS Hetzner (Docker + Traefik + TLS).",
        }),
        ("7acf891", "2026-06-17", "feat", "datos", "importador genérico OGR (GeoPackage, SHP, KML, GeoJSON…)", new[] {
            "Script import_ogr.sh soporta múltiples formatos geoespaciales vía ogr2ogr.",
            "Reducción del trabajo manual de ingesta de capas para el equipo técnico.",
        }),
        ("5170899", "2026-06-17", "feat", "landing", "página de presentación previa al login", new[] {
            "Versión inicial de la landing institucional con identidad del proyecto.",
        }),
        ("9bfacbc", "2026-06-17", "feat", "marca", "logos del proyecto y de la CRA + limpieza de navegación", new[] {
            "Integración de logos oficiales (CRA + proyecto) en cabecera y login.",
            "Limpieza del menú de navegación y la jerarquía de rutas.",
        }),
        ("3e5714e", "2026-06-17", "feat", "geovisor", "mapas base, herramientas UX y capas WMS del IGAC", new[] {
            "7 mapas base: satelital, topográfico, terreno, océano, calles, lona negra, lona clara.",
            "Herramientas UX: compartir por enlace, imprimir/exportar, descargar GeoJSON, coordenada en vivo.",
            "Capas oficiales IGAC vía WMS: catastro predial, pendientes (30 m) y agrología nacional.",
        }),
        ("d00857e", "2026-06-17", "feat", "restauracion", "capas temáticas (estratos, malezas, técnicas, validación)", new[] {
            "Migración 07: tablas y endpoints para estratos, malezas, técnicas y validación.",
            "Cumplimiento valor/meta por sitio y homologación temática provisional.",
        }),
        ("18cdfa1", "2026-06-17", "chore", "frontend", "dev usa backend real por defecto + soporte de demos por túnel", new[] {
            "Cambio de configuración: en dev se conecta al backend real por defecto.",
            "Soporte para túneles (ngrok / cloudflared) para demos a la Dirección del Proyecto.",
        }),
        ("2092d8c", "2026-06-12", "docs", "docs", "anexo H (registro fotográfico con pies de figura) + informe actualizado", new[] {
            "Anexo H: registro fotográfico de la aplicación con pies de figura numerados.",
            "Actualización del informe de avance contractual con el nuevo anexo.",
        }),
        ("9388d12", "2026-06-11", "docs", "docs", "informe de avance contractual (Contrato 324/2025)", new[] {
            "Versión inicial del informe de avance contractual.",
        }),
        ("a110d9a", "2026-06-11", "feat", "coberturas", "clasificación Corine del dron en geodatabase, API y visor", new[] {
            "Raster isoc_12 procesado y vectorizado: 20.057 polígonos → 11 clases consolidadas (96,3 ha).",
            "Endpoint /api/coberturas con simplificación geométrica para aligerar la transferencia.",
            "Overlay en el visor con paleta de 12 clases y popup ha/%.",
        }),
        ("c110d4b", "2026-06-11", "feat", "visor", "ortofoto del dron como capa de tiles XYZ", new[] {
            "GeoTIFF 8.9 GB (EPSG:4326, 3.1 cm/px) tileado con gdal2tiles (z13–20): 2.378 tiles / 259 MB.",
            "Overlay 'Ortofoto dron (predio)' en el visor.",
        }),
        ("19d7e1e", "2026-06-11", "feat", "crud", "registro de monitoreos desde la plataforma + cambio de contraseña", new[] {
            "Backend: GET/POST/PUT /api/monitoreos (admin/técnico) y DELETE (solo admin).",
            "Frontend: modal 'Registrar monitoreo' con estación, fecha, indicador, valor y observaciones.",
            "PUT /api/auth/password para cambio de contraseña del propio usuario.",
        }),
        ("6332302", "2026-06-10", "docs", "docs", "registrar cierre de brechas en changelog", new[] {
            "Documentación del cierre de las brechas contractuales detectadas en la auditoría de junio.",
        }),
        ("989b447", "2026-06-10", "feat", "spec", "auth+roles, reportes, geovisor completo, modelo spec, insumos dron e infra productiva", new[] {
            "Cierre del capítulo de brechas contractuales: autenticación JWT con 3 roles, módulo de reportes CSV/Excel/PDF,",
            "geovisor completo (medición + comparación temporal), modelo spec, 8 insumos dron catalogados,",
            "infraestructura productiva (Dockerfiles, Nginx, docker-compose.prod.yml, backups).",
        }),
        ("5158cf1", "2026-06-10", "feat", "geovisor", "F1: capas conmutables, filtros y búsqueda", new[] {
            "LayersControl.Overlay: encendido/apagado independiente de Zonas, Lotes y Puntos.",
            "FiltersPanel: filtros por categoría de calidad y tipo de ecosistema.",
            "Búsqueda geográfica por nombre y por lugar (Nominatim/OSM con flyTo).",
        }),
        ("530a414", "2026-06-10", "feat", "datos", "dejar solo datos reales + capa de puntos de control", new[] {
            "Eliminación de las 2 zonas de ejemplo del Anexo B (no eran datos de campo).",
            "Capa de puntos de control en el mapa (crosshair morado), separada de los 'sitios'.",
        }),
        ("16f0869", "2026-06-10", "docs+data", "docs", "alinear documentación y cargar datos del proyecto Luruaco", new[] {
            "Sincronización de la documentación con el estado real del proyecto.",
        }),
        ("8f9e65f", "2026-06-10", "feat", "frontend", "rediseño del visor a dashboard departamental tipo ICAM", new[] {
            "Cabecera con escala de calidad, pestañas, selector de periodo, lista de sitios, KPIs, dona y barras (SVG puro).",
            "Mapa Esri con puntos por categoría, footer institucional.",
        }),
        ("a0c79bc", "2026-06-09", "feat", "backend+db", "endpoint /api/resumen y dimensión de calidad", new[] {
            "Endpoint /api/resumen con totales y proporción por categoría (escala ICAM).",
            "Nuevos campos categoria_calidad y periodo en polígonos y lotes.",
        }),
        ("ec2092d", "2026-05-31", "chore", "infra", "commit inicial de respaldo + .gitignore", new[] {
            "Inicialización del repositorio y configuración de .gitignore (excluye .env, node_modules, binarios).",
        }),
    };

    public static int Generate(string outputPath)
    {
        if (File.Exists(outputPath)) File.Delete(outputPath);

        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var mainPart = doc.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        var body = mainPart.Document.Body!;

        BuildStyles(mainPart);
        BuildBody(mainPart, body);

        Console.WriteLine($"OK -> {outputPath}");
        return 0;
    }

    private static void BuildStyles(MainDocumentPart mainPart)
    {
        var stylesPart = mainPart.AddNewPart<StyleDefinitionsPart>();
        stylesPart.Styles = new Styles();
        var styles = stylesPart.Styles;

        styles.Append(new DocDefaults(
            new RunPropertiesDefault(
                new RunPropertiesBaseStyle(
                    new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri", EastAsia = "SimSun", ComplexScript = "Calibri" },
                    new FontSize { Val = "22" },
                    new FontSizeComplexScript { Val = "22" },
                    new Color { Val = SoftBlack },
                    new Languages { Val = "es-CO", EastAsia = "zh-CN" }
                )
            ),
            new ParagraphPropertiesDefault(
                new ParagraphPropertiesBaseStyle(
                    new SpacingBetweenLines { Line = "276", LineRule = LineSpacingRuleValues.Auto, After = "160" }
                )
            )
        ));

        styles.Append(new Style(
            new StyleName { Val = "Normal" },
            new UIPriority { Val = 0 },
            new PrimaryStyle()
        ) { Type = StyleValues.Paragraph, StyleId = "Normal", Default = true });

        styles.Append(MakeHeading(1, "40", Navy, true, "480", "120", 9));
        styles.Append(MakeHeading(2, "26", Teal, true, "360", "80", 9));
        styles.Append(MakeHeading(3, "22", Navy, true, "240", "80", 9));
    }

    private static Style MakeHeading(int level, string sizeHalf, string color, bool bold, string before, string after, int uiPriority)
    {
        var rPr = new StyleRunProperties(
            new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri", EastAsia = "SimSun" },
            new FontSize { Val = sizeHalf },
            new Color { Val = color }
        );
        if (bold) rPr.Append(new Bold());
        return new Style(
            new StyleName { Val = $"heading {level}" },
            new BasedOn { Val = "Normal" },
            new NextParagraphStyle { Val = "Normal" },
            new UIPriority { Val = uiPriority },
            new PrimaryStyle(),
            new StyleParagraphProperties(
                new KeepNext(),
                new KeepLines(),
                new SpacingBetweenLines { Before = before, After = after },
                new OutlineLevel { Val = level - 1 }
            ),
            rPr
        ) { Type = StyleValues.Paragraph, StyleId = $"Heading{level}" };
    }

    private static void BuildBody(MainDocumentPart mainPart, Body body)
    {
        var sectPr = new SectionProperties(
            new WpPageSize { Width = 11906U, Height = 16838U },
            new PageMargin { Top = 1440, Bottom = 1440, Left = 1440U, Right = 1440U, Header = 720U, Footer = 720U, Gutter = 0U }
        );

        AddHeader(mainPart, sectPr, "Anexo 4 · Bitácora de cambios y despliegues del repositorio");
        AddFooter(mainPart, sectPr);

        CoverPage(body);
        body.Append(PageBreak());

        // ════════ 1. INTRODUCCIÓN ════════
        H1(body, "1. Introducción");
        Para(body,
            "El presente anexo reporta la bitácora de cambios del repositorio del proyecto, desde el commit " +
            "inicial hasta la fecha de este informe (24 de junio de 2026). La bitácora se extrae directamente " +
            "del historial de Git con `git log --pretty=format:'%h | %ad | %s' --date=short` y se complementa " +
            "con descripciones técnicas de los cambios más relevantes para la comprensión del avance del contrato.");

        Para(body,
            "Este documento constituye el Anexo 4 de la Solicitud de Desembolso de la cláusula 3.2 del Contrato " +
            "UTL:001 y complementa el Anexo 1 (Informe Técnico de Avance) y el Anexo 3 (Reporte del estado real " +
            "de la Geodatabase).",
            italic: true);

        H2(body, "1.1. Estadísticas del repositorio");

        // Compute stats
        var typeCount = new Dictionary<string, int>();
        var scopeCount = new Dictionary<string, int>();
        foreach (var c in Commits)
        {
            if (!typeCount.ContainsKey(c.type)) typeCount[c.type] = 0;
            typeCount[c.type]++;
            if (!scopeCount.ContainsKey(c.scope)) scopeCount[c.scope] = 0;
            scopeCount[c.scope]++;
        }

        // Build type table
        var typeRows = new List<string[]>();
        foreach (var kv in typeCount.OrderByDescending(k => k.Value))
        {
            typeRows.Add(new[] { kv.Key, kv.Value.ToString(), DescribeType(kv.Key) });
        }

        ModernTable(body,
            new[] { "Tipo", "Conteo", "Descripción" },
            typeRows.ToArray()
        );

        // Build scope table
        var scopeRows = new List<string[]>();
        foreach (var kv in scopeCount.OrderByDescending(k => k.Value))
        {
            scopeRows.Add(new[] { kv.Key, kv.Value.ToString() });
        }
        ModernTable(body,
            new[] { "Scope", "Conteo" },
            scopeRows.ToArray()
        );

        Para(body, $"Total de commits registrados: {Commits.Length}", bold: true);
        Para(body, "Rango de fechas: 31 de mayo de 2026 (commit inicial) → 19 de junio de 2026 (último commit).");

        body.Append(PageBreak());

        // ════════ 2. BITÁCORA CRONOLÓGICA ════════
        H1(body, "2. Bitácora cronológica (orden inverso, más reciente primero)");

        Para(body,
            "Cada entrada muestra el hash, fecha, tipo y scope del commit según la convención Conventional Commits, " +
            "el subject y una descripción técnica del cambio.",
            italic: true);

        // Iterate in reverse (newest first) — array is in oldest-first order
        for (int i = Commits.Length - 1; i >= 0; i--)
        {
            var c = Commits[i];
            string typeColor = c.type switch
            {
                "feat" => Green,
                "fix" => Yellow,
                "chore" => Gray,
                "docs" => Teal,
                "docs+data" => Teal,
                _ => Gray,
            };
            string typeLabel = c.type.ToUpper();

            // Heading: "2026-06-19 · bc573fa · FEAT (landing) — video de muestra..."
            H2(body, $"{c.date}  ·  {c.hash}  ·  {typeLabel} ({c.scope})");
            Para(body, c.subject, bold: true);

            // Type badge
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                new Run(new RunProperties(new Bold(), new Color { Val = "FFFFFF" }, new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = typeColor }),
                    new Text($"  {c.type.ToUpper()}  "))
            ));

            // Details
            H3(body, "Cambios:");
            foreach (var d in c.details)
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(
                        new Indentation { Left = "360", Hanging = "180" },
                        new SpacingBetweenLines { After = "40" }
                    ),
                    new Run(new Text("•  ") { Space = SpaceProcessingModeValues.Preserve }),
                    new Run(new Text(d) { Space = SpaceProcessingModeValues.Preserve })
                ));
            }

            if (i > 0) body.Append(PageBreak());
        }

        body.Append(PageBreak());

        // ════════ 3. HITOS OPERATIVOS ════════
        H1(body, "3. Hitos operativos del proyecto");

        Para(body,
            "Los siguientes hitos operativos resumen los momentos clave del proyecto desde la óptica de la " +
            "operación técnica y de despliegue. No son releases formales sino momentos verificables que el " +
            "equipo técnico puede demostrar.");

        ModernTable(body,
            new[] { "Fecha", "Hito", "Verificación" },
            new[] {
                new[] { "2026-05-29", "Versión inicial del esquema PostGIS en producción", "Migración 01 ejecutada; eco_restauracion.* accesible" },
                new[] { "2026-05-31", "Commit inicial del repositorio", "ec2092d — backup completo + .gitignore" },
                new[] { "2026-06-09", "Endpoint /api/resumen con dimensión de calidad", "Backend: a0c79bc — ICAM" },
                new[] { "2026-06-10", "Rediseño del visor estilo ICAM + datos del proyecto", "8f9e65f + 530a414 + 16f0869" },
                new[] { "2026-06-10", "Geovisor F1: capas conmutables, filtros, búsqueda", "5158cf1" },
                new[] { "2026-06-10", "Cierre de brechas contractuales (auth, reportes, geovisor, infra)", "989b447" },
                new[] { "2026-06-11", "Coberturas Corine del dron en geodatabase, API y visor", "a110d9a — 11 clases, 96,3 ha" },
                new[] { "2026-06-11", "Ortofoto del dron como capa XYZ en el visor", "c110d4b — 2.378 tiles" },
                new[] { "2026-06-11", "CRUD de monitoreos + cambio de contraseña", "19d7e1e — /api/monitoreos" },
                new[] { "2026-06-12", "Anexo H (registro fotográfico) + informe actualizado", "2092d8c" },
                new[] { "2026-06-17", "Landing institucional + importador OGR + IGAC WMS", "5170899 + 7acf891 + 3e5714e" },
                new[] { "2026-06-17", "Despliegue en VPS Hetzner (Docker + Traefik + TLS)", "2d551f6 — geodatabase.mcconsultorias.com.co" },
                new[] { "2026-06-18", "Visor responsive (fix móvil)", "36a488e" },
                new[] { "2026-06-19", "Landing institucional responsive propia", "1c58869" },
                new[] { "2026-06-19", "Video de muestra en el hero de la landing", "bc573fa" },
            }
        );

        body.Append(PageBreak());

        // ════════ 4. ENTORNO DE PRODUCCIÓN ════════
        H1(body, "4. Entorno de producción");

        H2(body, "4.1. Infraestructura");
        ModernTable(body,
            new[] { "Componente", "Detalle" },
            new[] {
                new[] { "Proveedor VPS", "Hetzner (Alemania)" },
                new[] { "Sistema operativo", "Ubuntu 22.04 LTS" },
                new[] { "Contenedores", "Docker + docker-compose" },
                new[] { "Reverse proxy", "Traefik v2" },
                new[] { "TLS", "Let's Encrypt (renovación automática)" },
                new[] { "Dominio", "geodatabase.mcconsultorias.com.co" },
                new[] { "Backups", "Automáticos diarios (script backup_db.sh)" },
            }
        );

        H2(body, "4.2. Stack tecnológico");
        ModernTable(body,
            new[] { "Capa", "Tecnología" },
            new[] {
                new[] { "Backend", "Go 1.22 + Fiber v2.52.13 + lib/pq" },
                new[] { "Frontend", "React 19 + TypeScript 5 + Vite + Leaflet 5" },
                new[] { "Base de datos", "PostgreSQL 15 + PostGIS 3.4" },
                new[] { "Cache / Proxy", "Traefik (TLS, headers, rate-limit básico)" },
                new[] { "Geoprocesamiento", "GDAL/OGR + gdal2tiles" },
            }
        );

        H2(body, "4.3. URL operativa");
        Para(body, "Plataforma: https://geodatabase.mcconsultorias.com.co", bold: true);
        Para(body, "API base: https://geodatabase.mcconsultorias.com.co/api/");
        Para(body, "Health check: https://geodatabase.mcconsultorias.com.co/health");
        Para(body, "Repositorio: local (código fuente versionado, control de cambios auditables).");

        // ════════ 5. PROCEDIMIENTO DE REPRODUCCIÓN ════════
        body.Append(PageBreak());
        H1(body, "5. Procedimiento de reproducción de la bitácora");

        Para(body, "Cualquier operador puede reproducir el listado de commits con el siguiente comando:");
        Para(body, "git log --pretty=format:'%h | %ad | %s' --date=short", italic: true);

        Para(body, "Para obtener el detalle ampliado de un commit específico (mensaje completo, archivos modificados, " +
            "diff):");
        Para(body, "git show <hash>           # ej: git show bc573fa", italic: true);

        Para(body, "Para listar los archivos modificados entre dos commits:");
        Para(body, "git diff --name-status <hash-inicial>..<hash-final>", italic: true);

        Para(body, " ");
        Para(body,
            "Bitácora generada el 24 de junio de 2026 a partir del historial de Git del repositorio. " +
            "Este documento constituye el Anexo 4 de la Solicitud de Desembolso de la cláusula 3.2 del " +
            "Contrato UTL:001.",
            italic: true);

        body.Append(sectPr);
    }

    private static string DescribeType(string type) => type switch
    {
        "feat" => "Nueva funcionalidad o capacidad",
        "fix" => "Corrección de un defecto",
        "chore" => "Tarea de mantenimiento o configuración",
        "docs" => "Cambio de documentación",
        "docs+data" => "Documentación + ajuste de datos",
        _ => "Otro",
    };

    private static void CoverPage(Body body)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "480", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "56" }, new Color { Val = Teal }, new Bold()),
                new Text("◆")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "120" }, new Justification { Val = JustificationValues.Center }),
            new Run(
                new RunProperties(new FontSize { Val = "22" }, new Color { Val = CaptionGray }, new Bold(), new Spacing { Val = 40 }),
                new Text("MC CONSULTORÍAS & CAPACITACIÓN S.A.S.")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "0", After = "120" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "48" }, new Color { Val = Navy }, new Bold()),
                new Text("Anexo 4")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "32" }, new Color { Val = Teal }, new Italic()),
                new Text("Bitácora de cambios y despliegues del repositorio")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = SoftBlack }),
                new Text("Soporte técnico de la cláusula 3.2 — Contrato UTL:001")
            )
        ));

        var coverTable = new Table();
        coverTable.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Teal },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Teal },
                new LeftBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new RightBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = "D9D9D9" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "80", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "120", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "80", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "120", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "2700" });
        grid.Append(new GridColumn { Width = "6326" });
        coverTable.Append(grid);

        (string label, string value)[] metadata = new[] {
            ("Documento", "Anexo 4 — Bitácora de cambios y despliegues"),
            ("Contrato", "UTL:001"),
            ("Soporta", "Solicitud de desembolso — Cláusula 3.2"),
            ("Total de commits", "23 (31-may-2026 → 19-jun-2026)"),
            ("Convención", "Conventional Commits (feat / fix / chore / docs / docs+data)"),
            ("Herramienta", "git log --pretty=format:'%h | %ad | %s' --date=short"),
            ("Plataforma desplegada", "geodatabase.mcconsultorias.com.co"),
            ("Fecha de la bitácora", "24 de junio de 2026"),
        };

        for (int i = 0; i < metadata.Length; i++)
        {
            var row = new TableRow();
            var tc1Pr = new TableCellProperties(new TableCellWidth { Width = "2700", Type = TableWidthUnitValues.Dxa });
            if (i % 2 == 1) tc1Pr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
            row.Append(new TableCell(tc1Pr,
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = Navy }), new Text(metadata[i].label))
                )
            ));
            var tc2Pr = new TableCellProperties(new TableCellWidth { Width = "6326", Type = TableWidthUnitValues.Dxa });
            if (i % 2 == 1) tc2Pr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
            row.Append(new TableCell(tc2Pr,
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new Text(metadata[i].value))
                )
            ));
            coverTable.Append(row);
        }
        body.Append(coverTable);

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "720" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = Navy }, new Bold()),
                new Text("Junio · 2026")
            )
        ));
    }

    // ─────────────────────── HELPERS ───────────────────────
    private static void H1(Body body, string text) => body.Append(new Paragraph(
        new ParagraphProperties(new ParagraphStyleId { Val = "Heading1" }),
        new Run(new Text(text))
    ));

    private static void H2(Body body, string text) => body.Append(new Paragraph(
        new ParagraphProperties(new ParagraphStyleId { Val = "Heading2" }),
        new Run(new Text(text))
    ));

    private static void H3(Body body, string text) => body.Append(new Paragraph(
        new ParagraphProperties(new ParagraphStyleId { Val = "Heading3" }),
        new Run(new Text(text))
    ));

    private static void H2Inline(Body body, string text)
    {
        // Kept for backwards compatibility but not currently used.
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
            new Run(new RunProperties(new Bold(), new Color { Val = Teal }, new FontSize { Val = "22" }), new Text(text))
        ));
    }

    private static void Para(Body body, string text, bool italic = false, bool bold = false)
    {
        var rPr = new RunProperties();
        if (italic) rPr.Append(new Italic());
        if (bold) rPr.Append(new Bold());
        body.Append(new Paragraph(
            new ParagraphProperties(),
            new Run(rPr, new Text(text) { Space = SpaceProcessingModeValues.Preserve })
        ));
    }

    private static Paragraph PageBreak() => new Paragraph(new Run(new Break { Type = BreakValues.Page }));

    private static void ModernTable(Body body, string[] headers, string[][] data)
    {
        body.Append(BuildTable(headers, data, null));
    }

    private static Table BuildTable(string[] headers, string[][] data, int? statusColumnIndex)
    {
        var table = new Table();
        table.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Navy },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Navy },
                new LeftBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new RightBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = "D9D9D9" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "40", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "80", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "40", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "80", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        int colW = 9026 / headers.Length;
        foreach (var _ in headers) grid.Append(new GridColumn { Width = colW.ToString() });
        table.Append(grid);

        var hRow = new TableRow();
        foreach (var h in headers)
        {
            hRow.Append(new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "0", Type = TableWidthUnitValues.Auto },
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = HeaderFill },
                    new TableCellBorders(new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Navy })
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = "FFFFFF" }, new FontSize { Val = "20" }), new Text(h))
                )
            ));
        }
        table.Append(hRow);

        for (int i = 0; i < data.Length; i++)
        {
            var row = new TableRow();
            for (int c = 0; c < data[i].Length; c++)
            {
                string cellText = data[i][c];
                var tcPr = new TableCellProperties(new TableCellWidth { Width = "0", Type = TableWidthUnitValues.Auto });
                if (i % 2 == 1)
                {
                    tcPr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
                }
                row.Append(new TableCell(tcPr,
                    new Paragraph(
                        new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                        new Run(new Text(cellText) { Space = SpaceProcessingModeValues.Preserve })
                    )
                ));
            }
            table.Append(row);
        }
        return table;
    }

    private static void AddHeader(MainDocumentPart mainPart, SectionProperties sectPr, string text)
    {
        var headerPart = mainPart.AddNewPart<HeaderPart>();
        headerPart.Header = new Header(
            new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Center },
                    new ParagraphBorders(new BottomBorder { Val = BorderValues.Single, Size = 4, Space = 4, Color = Teal })
                ),
                new Run(
                    new RunProperties(new Color { Val = Navy }, new FontSize { Val = "18" }, new Bold()),
                    new Text(text) { Space = SpaceProcessingModeValues.Preserve }
                )
            )
        );
        headerPart.Header.Save();
        sectPr.Append(new HeaderReference { Type = HeaderFooterValues.Default, Id = mainPart.GetIdOfPart(headerPart) });
    }

    private static void AddFooter(MainDocumentPart mainPart, SectionProperties sectPr)
    {
        var footerPart = mainPart.AddNewPart<FooterPart>();
        var footerTable = new Table();
        footerTable.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = Teal },
                new BottomBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new LeftBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new RightBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideHorizontalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "40", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "0", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "0", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "0", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "6626" });
        grid.Append(new GridColumn { Width = "2400" });
        footerTable.Append(grid);

        var row = new TableRow();
        row.Append(new TableCell(
            new TableCellProperties(new TableCellWidth { Width = "6626", Type = TableWidthUnitValues.Dxa }),
            new Paragraph(
                new ParagraphProperties(new Justification { Val = JustificationValues.Left }, new SpacingBetweenLines { After = "0" }),
                new Run(new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }),
                    new Text("MC Consultorías & Capacitación S.A.S. · Confidencial") { Space = SpaceProcessingModeValues.Preserve })
            )
        ));
        var rightCellPara = new Paragraph(
            new ParagraphProperties(new Justification { Val = JustificationValues.Right }, new SpacingBetweenLines { After = "0" })
        );
        rightCellPara.Append(new Run(new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }), new Text("Página ") { Space = SpaceProcessingModeValues.Preserve }));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Begin }));
        rightCellPara.Append(new Run(new FieldCode(" PAGE ") { Space = SpaceProcessingModeValues.Preserve }));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Separate }));
        rightCellPara.Append(new Run(new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }), new Text("1")));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.End }));
        rightCellPara.Append(new Run(new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }), new Text(" de ") { Space = SpaceProcessingModeValues.Preserve }));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Begin }));
        rightCellPara.Append(new Run(new FieldCode(" NUMPAGES ") { Space = SpaceProcessingModeValues.Preserve }));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Separate }));
        rightCellPara.Append(new Run(new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }), new Text("1")));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.End }));
        row.Append(new TableCell(
            new TableCellProperties(new TableCellWidth { Width = "2400", Type = TableWidthUnitValues.Dxa }),
            rightCellPara
        ));
        footerTable.Append(row);
        footerPart.Footer = new Footer(footerTable);
        footerPart.Footer.Save();
        sectPr.Append(new FooterReference { Type = HeaderFooterValues.Default, Id = mainPart.GetIdOfPart(footerPart) });
    }
}
