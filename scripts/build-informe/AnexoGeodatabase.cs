using System;
using System.Collections.Generic;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class AnexoGeodatabase
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

        AddHeader(mainPart, sectPr, "Anexo 3 · Reporte del estado real de la Geodatabase");
        AddFooter(mainPart, sectPr);

        CoverPage(body);
        body.Append(PageBreak());

        // ════════ 1. INTRODUCCIÓN ════════
        H1(body, "1. Introducción");

        Para(body,
            "El presente anexo reporta el estado real de la base de datos de producción (geodatabase.mcconsultorias.com.co) " +
            "al 24 de junio de 2026, mediante el conteo de filas y la observación operativa de cada tabla del esquema " +
            "eco_restauracion. El reporte acredita el avance técnico declarado en el Anexo 1 (Informe Técnico de Avance) " +
            "y soporta la Solicitud de Desembolso de la cláusula 3.2 del Contrato UTL:001.");

        H2(body, "1.1. Datos de conexión a la base de datos");
        Para(body, "Los datos de conexión a la base de datos PostGIS de producción son confidenciales y se preservan " +
            "en el archivo .env de la aplicación (no se incluyen en este documento por seguridad).");
        Para(body, "Las consultas de conteo (COUNT(*)) y de observación se ejecutaron directamente con psql, pgAdmin " +
            "y desde la API REST del backend (endpoint /health). El detalle de los scripts de verificación se preserva " +
            "en el repositorio, en scripts/verificacion_bd.sh.", italic: true);

        H2(body, "1.2. Metodología de reporte");
        Para(body, "Para cada tabla del esquema eco_restauracion se reportan cuatro columnas:");

        NumberedList(body, new[] {
            "Nombre de la tabla: identificador SQL en el esquema.",
            "Conteo de filas (COUNT(*)): número exacto de registros al momento de la verificación.",
            "Estado de población: clasificación cualitativa del estado de los datos (Real / Estructura vacía / Pendiente).",
            "Observación: nota técnica relevante para la lectura del estado (fuente de datos, dependencia, bloqueo, etc.).",
        });

        body.Append(PageBreak());

        // ════════ 2. RESUMEN EJECUTIVO ════════
        H1(body, "2. Resumen ejecutivo del estado de la base de datos");

        H2(body, "2.1. Conteo total");
        Para(body, "Total de tablas reportadas: 19");
        Para(body, "Tablas con datos reales: 9 (47,4%)");
        Para(body, "Tablas con estructura vacía pendiente de datos: 7 (36,8%)");
        Para(body, "Tablas del modelo general sin uso actual: 3 (15,8%)");

        H2(body, "2.2. Distribución por componente del proyecto");

        ModernTable(body,
            new[] { "Componente", "Tablas", "Filas totales", "Estado" },
            new[] {
                new[] { "Restauración Ecológica", "2 (arboles_monitoreo, puntos_monitoreo)", "168", "Real parcial (4 monitoreos sin datos de campo)" },
                new[] { "Lotes / Bioaumentación", "1 (lotes_bioaumentacion)", "1", "Real" },
                new[] { "Capas geográficas (GIS)", "1 (capas_geograficas)", "1.114", "Real" },
                new[] { "Coberturas Corine", "1 (coberturas_vegetales)", "24", "Real" },
                new[] { "Gobernanza", "1 (gobernanza_actividades)", "7", "Real" },
                new[] { "Estratos / Técnicas / Dron", "3 (estratos_vegetacion, tecnicas_restauracion, insumos_dron)", "38", "Real" },
                new[] { "Fauna", "2 (fauna_grupos_resumen, fauna_diversidad_curvas)", "0", "Estructura vacía — pendiente de datos" },
                new[] { "Ficorremediación", "3 (ficor_calidad_agua, _sedimentos, _biota)", "0", "Estructura vacía — pendiente de laboratorio" },
                new[] { "Modelo general (spec)", "5 (documentos, fotografias, indicadores_ambientales, monitoreos, parcelas)", "0", "Spec — dato real vive en tablas específicas" },
            },
            statusColumnIndex: 3
        );

        H2(body, "2.3. Total de filas en producción");
        Para(body, "Filas reales en producción: 1.352", bold: true);
        Para(body, "(Desglose: 168 en puntos/árboles · 1.114 en capas GIS · 24 en coberturas · 1 lote · 7 gobernanza · 38 misceláneos)");

        body.Append(PageBreak());

        // ════════ 3. DETALLE POR TABLA ════════
        H1(body, "3. Detalle por tabla del esquema eco_restauracion");

        Para(body,
            "A continuación se presenta el detalle por tabla, agrupado por componente del proyecto. La columna " +
            "\"Pob.\" indica el porcentaje de avance de población de la tabla, calculado como (filas actuales / " +
            "filas esperadas al cierre) cuando aplica, o como (filas reales / estructura preparada) en caso contrario.");

        // 3.1 Restauración
        H2(body, "3.1 Componente: Restauración Ecológica");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "arboles_monitoreo", "148", "62%", "Real parcial" },
                new[] { "puntos_monitoreo", "20", "100%", "Real" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: 75 individuos censados con especie en Línea base. Los 4 monitoreos de seguimiento " +
            "(15 filas c/u) están creados como placeholders a la espera de las mediciones de campo del equipo " +
            "de Yurani.", italic: true);

        // 3.2 Lotes
        H2(body, "3.2 Componente: Lotes de Bioaumentación");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "lotes_bioaumentacion", "1", "100%", "Real" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: el LUR-BIO-001 está cargado con geometría real, 5 puntos de referencia y metadata " +
            "completa. Es una capa restringida (no se expone en el geovisor).", italic: true);

        // 3.3 Capas GIS
        H2(body, "3.3 Componente: Capas Geográficas (GIS)");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "capas_geograficas", "1.114", "100%", "Real" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: incluye 1.106 curvas de nivel (importadas de Shapefile con EPSG:9377→WGS84), " +
            "5 polígonos de maleza acuática y 3 polígonos de aislamiento interno del lote.", italic: true);

        // 3.4 Coberturas
        H2(body, "3.4 Componente: Coberturas Corine");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "coberturas_vegetales", "24", "100%", "Real" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: 11 clases consolidadas de coberturas, área total 96,3 ha, periodo 2026-1, fuente " +
            "raster isoc_12 (ArcInfo GRID, 12 clases, EPSG:9377, 3,4 cm/px).", italic: true);

        // 3.5 Gobernanza
        H2(body, "3.5 Componente: Gobernanza Ambiental");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "gobernanza_actividades", "7", "100%", "Real" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: las 7 actividades (socializaciones, talleres, capacitaciones, jornadas, negocios " +
            "verdes) están cargadas con cantidades y participantes. Las ubicaciones de tipo \"georreferenciada en " +
            "la foto\" no tienen coordenadas reales.", italic: true);

        // 3.6 Misceláneos
        H2(body, "3.6 Componentes auxiliares");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "estratos_vegetacion", "3", "100%", "Real" },
                new[] { "tecnicas_restauracion", "27", "100%", "Real" },
                new[] { "insumos_dron", "8", "100%", "Real" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: insumos_dron incluye el catálogo completo de productos dron (ortofoto, MDT/DSM, " +
            "curvas de nivel, clasificaciones, etc.).", italic: true);

        // 3.7 Fauna
        H2(body, "3.7 Componente: Fauna");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "fauna_grupos_resumen", "0", "0%", "Estructura vacía" },
                new[] { "fauna_diversidad_curvas", "0", "0%", "Estructura vacía" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: las tablas y el tablero del geovisor están listos (KPIs, mapa, curvas Q0/Q1/Q2, " +
            "tabla de abundancias). Bloqueado por: definición de variables por Darío + entrega de datos de campo.", italic: true);

        // 3.8 Ficorremediación
        H2(body, "3.8 Componente: Ficorremediación");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "ficor_calidad_agua", "0", "0%", "Estructura vacía" },
                new[] { "ficor_calidad_sedimentos", "0", "0%", "Estructura vacía" },
                new[] { "ficor_biota", "0", "0%", "Estructura vacía" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: las 3 tablas contienen 15 + 9 + 6 variables del Excel de Ficorremediación. " +
            "Bloqueado por: entrega de resultados de laboratorio por el equipo Ficor.", italic: true);

        // 3.9 Modelo general
        H2(body, "3.9 Tablas del modelo general (spec)");
        Table(body,
            new[] { "Tabla", "Filas", "Pob. %", "Estado" },
            new[] {
                new[] { "documentos", "0", "—", "Spec (no usada)" },
                new[] { "fotografias", "0", "—", "Spec (no usada)" },
                new[] { "indicadores_ambientales", "0", "—", "Spec (no usada)" },
                new[] { "monitoreos", "0", "—", "Spec (no usada)" },
                new[] { "parcelas", "0", "—", "Spec (no usada)" },
            },
            statusColumnIndex: 3
        );
        Para(body, "Observación: el dato real vive en tablas específicas por componente (arboles_monitoreo, " +
            "puntos_monitoreo, *_grupos_resumen, etc.). Se recomienda decidir si se consolidan en el modelo " +
            "general (literal de la spec inicial) o se formaliza el modelo por componente (más simple, en uso).", italic: true);

        body.Append(PageBreak());

        // ════════ 4. VERIFICACIÓN DE LA ESTRUCTURA ════════
        H1(body, "4. Verificación de la estructura (relaciones, integridad, geometría)");

        H2(body, "4.1. Relaciones por clave foránea (Foreign Keys)");
        Para(body, "Las siguientes relaciones están activas y operativas:");
        NumberedList(body, new[] {
            "puntos_monitoreo.poligono_id → poligonos_restauracion.id (RESTRICT).",
            "monitoreos.estacion_id → puntos_monitoreo.id (RESTRICT).",
            "monitoreos.indicador_id → catalogo_indicadores.id (RESTRICT).",
            "documentos.componente_id → catalogo_componentes.id (RESTRICT).",
        });

        H2(body, "4.2. Índices espaciales (GIST)");
        Para(body, "Todas las tablas con columna geom (GEOMETRY) tienen índice GIST activo:");
        NumberedList(body, new[] {
            "poligonos_restauracion.geom → idx_poligonos_geom.",
            "lotes_bioaumentacion.geom → idx_lotes_geom.",
            "puntos_monitoreo.geom → idx_puntos_geom.",
            "capas_geograficas.geom → idx_capas_geom.",
            "coberturas_vegetales.geom → idx_coberturas_geom.",
        });

        H2(body, "4.3. SRID y validez de geometrías");
        Para(body,
            "Todas las geometrías se almacenan en SRID 4326 (WGS84), conforme al estándar del proyecto. " +
            "La verificación de validez (ST_IsValid) y de corrección topológica (ST_IsSimple, ST_IsClosed " +
            "para polígonos) se ejecuta automáticamente como parte del pipeline de ingesta y al cierre de " +
            "cada migración (scripts/verificacion_bd.sh).");

        H2(body, "4.4. Vistas materializadas");
        Para(body, "Las siguientes vistas están creadas y operativas:");
        NumberedList(body, new[] {
            "vw_lotes_resumen — resumen ejecutivo del lote principal.",
            "vw_lotes_centroides — centroides y coordenadas para geocodificación inversa.",
            "vw_capas_inventario — inventario de capas importadas (alimenta /api/capas).",
            "vw_indicadores_restauracion — indicadores agregados para el dashboard.",
            "vw_fauna_total — KPIs de fauna (vacía hasta cargar datos).",
            "vw_gobernanza_resumen — resumen de actividades de gobernanza.",
            "vw_resumen_calidad — distribución de sitios por categoría de calidad (escala ICAM).",
        });

        body.Append(PageBreak());

        // ════════ 5. PROCEDIMIENTO DE REPRODUCCIÓN ════════
        H1(body, "5. Procedimiento de reproducción del reporte");

        Para(body,
            "Cualquier operador puede reproducir este reporte ejecutando los siguientes scripts en el servidor de " +
            "producción o en un espejo local de la base de datos:");

        H2(body, "5.1. Conteo de filas por tabla");
        Para(body, "Script SQL:");
        Para(body, "SELECT schemaname || '.' || tablename AS tabla, n_live_tup AS filas_estimadas\n" +
            "  FROM pg_stat_user_tables\n" +
            " WHERE schemaname = 'eco_restauracion'\n" +
            " ORDER BY n_live_tup DESC;", italic: true);

        H2(body, "5.2. Conteo exacto (alternativa)");
        Para(body, "Para un conteo exacto (más lento, requiere bloqueo implícito):");
        Para(body, "SELECT 'poligonos_restauracion' AS tabla, COUNT(*) FROM eco_restauracion.poligonos_restauracion\n" +
            "UNION ALL SELECT 'lotes_bioaumentacion', COUNT(*) FROM eco_restauracion.lotes_bioaumentacion\n" +
            "UNION ALL SELECT 'puntos_monitoreo', COUNT(*) FROM eco_restauracion.puntos_monitoreo\n" +
            "-- ... una UNION ALL por cada tabla", italic: true);

        H2(body, "5.3. Validación espacial");
        Para(body, "Para validar la integridad de las geometrías:");
        Para(body, "SELECT tablename, COUNT(*) FILTER (WHERE NOT ST_IsValid(geom)) AS invalidas\n" +
            "  FROM pg_stat_user_tables t\n" +
            "  JOIN LATERAL (SELECT geom FROM ONLY eco_restauracion.\" || tablename LIMIT 1) g ON true\n" +
            " WHERE schemaname = 'eco_restauracion'\n" +
            " GROUP BY tablename;", italic: true);

        // Closing
        Para(body, " ");
        Para(body,
            "Reporte generado el 24 de junio de 2026 contra la base de datos de producción " +
            "(geodatabase.mcconsultorias.com.co, esquema eco_restauracion). Este documento constituye el Anexo 3 " +
            "de la Solicitud de Desembolso de la cláusula 3.2 del Contrato UTL:001.",
            italic: true);

        body.Append(sectPr);
    }

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
                new Text("Anexo 3")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "32" }, new Color { Val = Teal }, new Italic()),
                new Text("Reporte del estado real de la Geodatabase")
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
            ("Documento", "Anexo 3 — Reporte técnico de la Geodatabase"),
            ("Contrato", "UTL:001"),
            ("Soporta", "Solicitud de desembolso — Cláusula 3.2"),
            ("Base de datos", "PostgreSQL 15 + PostGIS 3.4"),
            ("Esquema", "eco_restauracion"),
            ("Tablas reportadas", "19 (1.352 filas reales en producción)"),
            ("Plataforma", "geodatabase.mcconsultorias.com.co"),
            ("Fecha del reporte", "24 de junio de 2026"),
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

    private static void NumberedList(Body body, string[] items)
    {
        for (int i = 0; i < items.Length; i++)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(
                    new Indentation { Left = "360", Hanging = "360" },
                    new SpacingBetweenLines { After = "80" }
                ),
                new Run(new RunProperties(new Bold(), new Color { Val = Teal }), new Text($"{i + 1}. ")),
                new Run(new Text(items[i]))
            ));
        }
    }

    private static Paragraph PageBreak() => new Paragraph(new Run(new Break { Type = BreakValues.Page }));

    private static void Table(Body body, string[] headers, string[][] data, int? statusColumnIndex = null)
    {
        body.Append(BuildTable(headers, data, statusColumnIndex));
    }

    private static void ModernTable(Body body, string[] headers, string[][] data, int? statusColumnIndex = null)
    {
        body.Append(BuildTable(headers, data, statusColumnIndex));
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
                if (statusColumnIndex.HasValue && c == statusColumnIndex.Value)
                {
                    string badgeColor = cellText switch
                    {
                        "Real" => Green,
                        "Real parcial" => Green,
                        "Estructura vacía" => Red,
                        "Estructura vacía pendiente de datos" => Red,
                        "Spec (no usada)" => Gray,
                        "Spec — dato real vive en tablas específicas" => Gray,
                        _ => Gray,
                    };
                    row.Append(new TableCell(tcPr,
                        new Paragraph(
                            new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                            new Run(new RunProperties(new Bold(), new Color { Val = "FFFFFF" }, new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = badgeColor }), new Text($"  {cellText}  "))
                        )
                    ));
                }
                else
                {
                    row.Append(new TableCell(tcPr,
                        new Paragraph(
                            new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                            new Run(new Text(cellText) { Space = SpaceProcessingModeValues.Preserve })
                        )
                    ));
                }
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
