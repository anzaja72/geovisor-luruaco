using System;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class FichaProyecto
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
    private const string SectionFill = "EEF2F6";

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
                    new SpacingBetweenLines { Line = "300", LineRule = LineSpacingRuleValues.Auto, After = "200" }
                )
            )
        ));

        styles.Append(new Style(
            new StyleName { Val = "Normal" },
            new UIPriority { Val = 0 },
            new PrimaryStyle()
        ) { Type = StyleValues.Paragraph, StyleId = "Normal", Default = true });
    }

    // ─────────────────────── BODY ───────────────────────
    private static void BuildBody(MainDocumentPart mainPart, Body body)
    {
        var sectPr = new SectionProperties(
            new WpPageSize { Width = 11906U, Height = 16838U },
            new PageMargin { Top = 1440, Bottom = 1440, Left = 1440U, Right = 1440U, Header = 720U, Footer = 720U, Gutter = 0U }
        );

        AddHeader(mainPart, sectPr, "Ficha técnica del proyecto · Geodatabase Luruaco");
        AddFooter(mainPart, sectPr);

        // ════════ TITLE + SUBTITLE ════════
        Title(body, "Geodatabase Luruaco");
        Subtitle(body, "Plataforma geoespacial para monitoreo y trazabilidad de la restauración ecológica de la Ciénaga de Luruaco.");

        // ════════ §1. DESCRIPCIÓN DE LA OPERACIÓN ════════
        SectionHeader(body, "1. Descripción de la Operación");
        Para(body,
            "Geodatabase Luruaco integra información geoespacial, biológica, ambiental y operativa de los cinco " +
            "componentes del proyecto de restauración ecológica (Restauración, Vegetación Acuática, Ficorremediación, " +
            "Fauna y Gobernanza) en una plataforma única, accesible vía web y orientada a la trazabilidad de las " +
            "intervenciones en la Ciénaga de Luruaco, Atlántico, Colombia. La plataforma permite a la entidad " +
            "contratante visualizar, consultar y reportar el avance del proyecto con base en datos reales " +
            "georreferenciados en PostGIS.");

        // ════════ §2. SUB-SISTEMAS DEL NÚCLEO INTEGRADOS ════════
        SectionHeader(body, "2. Sub-sistemas del Núcleo Integrados");
        BulletList(body, new[] {
            "Geodatabase PostGIS oficial con 19 tablas activas y datos reales integrados de los cinco componentes del proyecto",
            "Geovisor institucional con mapas base satelitales y oficiales (IGAC vía WMS), filtros por categoría y tipo de ecosistema",
            "Módulo de monitoreo biológico con curvas de diversidad, KPIs y registros de campo por estación",
            "Módulo de reportes abiertos (CSV, Excel, PDF) para sitios, coberturas, monitoreos, indicadores e insumos dron",
            "Autenticación con tres roles (administrador, técnico, consulta) y trazabilidad por usuario responsable",
            "Importador genérico de capas geográficas (GeoPackage, Shapefile, KML, GeoJSON) vía OGR",
            "Ortofoto de alta resolución del dron como capa de tiles XYZ sobre el predio (z13–20)",
        });

        // ════════ STACK TECNOLÓGICO (BACKEND) ════════
        StackHeader(body, "BACKEND GEOESPACIAL (GO + POSTGRESQL/POSTGIS)");
        BulletList(body, new[] {
            "API REST en Go 1.22 con framework Fiber y middleware CORS configurable por entorno",
            "Persistencia en PostgreSQL 15 con extensión PostGIS 3.4 (SRID 4326, geometrías validadas)",
            "Autenticación JWT con bcrypt para contraseñas y control de acceso por rol",
            "Modelo de datos geográficos normalizado con claves foráneas e índices espaciales GIST",
            "Vistas materializadas para indicadores agregados (calidad, fauna, gobernanza, coberturas)",
        });

        // ════════ STACK TECNOLÓGICO (FRONTEND) ════════
        StackHeader(body, "FRONTEND GEOVISOR (REACT + LEAFLET)");
        BulletList(body, new[] {
            "SPA en React 19 + TypeScript con Vite 8 como build tool",
            "Mapas interactivos con Leaflet 5, capas conmutables y ortofoto del dron",
            "Dashboard departamental tipo ICAM con escala de calidad, KPIs, dona y barras (SVG puro)",
            "Tablas y modales de captura con validación en cliente y confirmación de servidor",
            "Diseño responsive mobile-first con sidebar colapsable y popups optimizados para touch",
        });

        // ════════ STACK TECNOLÓGICO (DATOS Y GEOPROCESAMIENTO) ════════
        StackHeader(body, "DATOS Y GEOPROCESAMIENTO (GEOSPATIAL DATA STACK)");
        BulletList(body, new[] {
            "Almacenamiento de geometrías PostGIS con SRID 4326 (WGS84) y validación topológica",
            "Catálogo de insumos dron (ortofoto, MDT/DSM, curvas de nivel, clasificaciones)",
            "Procesamiento raster con GDAL/OGR (vectorización, tileado, reproyección EPSG:9377→WGS84)",
            "Servicios WMS oficiales del IGAC consumidos en línea (catastro, pendientes, agrología)",
            "Pipeline de ingestión de capas geográficas con transformación de sistemas de coordenadas",
        });

        // ════════ STACK TECNOLÓGICO (INFRAESTRUCTURA) ════════
        StackHeader(body, "INFRAESTRUCTURA PRODUCTIVA (DEVOPS)");
        BulletList(body, new[] {
            "VPS Hetzner (Ubuntu 22.04) con contenedores Docker y orquestación docker-compose",
            "Reverse proxy Traefik v2 con TLS automático (Let's Encrypt) y renovación transparente",
            "Pipeline de despliegue continuo con health checks y rollback de la última versión estable",
            "Backups automáticos diarios de la base de datos (script backup_db.sh)",
            "Dominio institucional geodatabase.mcconsultorias.com.co con TLS válido",
        });

        // ════════ §3. ENTREGABLES OPERATIVOS ════════
        SectionHeader(body, "3. Componentes del Proyecto Cubiertos");
        BulletList(body, new[] {
            "Restauración Ecológica: polígonos de restauración, puntos de monitoreo, censo forestal, escala de calidad ICAM",
            "Vegetación Acuática: polígonos de maleza acuática, comparativo ANTES/DESPUÉS, medición de distancia y área",
            "Ficorremediación: 5 puntos georreferenciados, lote de bioaumentación LUR-BIO-001, tablero de calidad de agua/sedimentos/biota",
            "Monitoreo de Fauna: KPIs de riqueza y abundancia, curvas de rarefacción Q0/Q1/Q2, tabla de abundancias por especie",
            "Gobernanza Ambiental: 7 actividades reales (socializaciones, talleres, jornadas, negocios verdes)",
        });

        // ════════ §4. CUMPLIMIENTO ════════
        SectionHeader(body, "4. Estándar de Cumplimiento");
        Para(body,
            "La plataforma opera conforme a los lineamientos del IGAC para gestión de información geoespacial " +
            "oficial en Colombia, incorpora el catálogo de objetos geográficos nacional, y cumple con la " +
            "normatividad ambiental aplicable (Política Nacional de Restauración Ecológica, estándares de calidad " +
            "del IDEAM y guías MAVDT para monitoreo de humedales). La trazabilidad de los datos se preserva " +
            "mediante versionamiento del esquema (migraciones SQL) y bitácora de cambios del repositorio.");

        // Closing metadata table (key facts at a glance)
        SectionHeader(body, "5. Datos de Referencia");
        body.Append(BuildMetadataTable());
    }

    private static Table BuildMetadataTable()
    {
        var t = new Table();
        t.Append(new TableProperties(
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
                new TopMargin { Width = "60", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "120", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "60", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "120", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "2700" });
        grid.Append(new GridColumn { Width = "6326" });
        t.Append(grid);

        (string label, string value)[] meta = new[] {
            ("Contrato", "UTL:001 — Unión Temporal Restauración Luruaco"),
            ("Contratista", "MC Consultorías & Capacitación S.A.S. (NIT 900.614.837-8)"),
            ("Plazo", "22 meses (02-mar-2026 → 02-ene-2028)"),
            ("Componentes", "5 (Restauración · Vegetación Acuática · Ficorremediación · Fauna · Gobernanza)"),
            ("URL de producción", "https://geodatabase.mcconsultorias.com.co"),
            ("Stack", "Go 1.22 + Fiber · React 19 + TypeScript · PostgreSQL 15 + PostGIS 3.4"),
            ("Filas reales en BD", "1.352 distribuidas en 9 tablas con datos del proyecto"),
        };

        for (int i = 0; i < meta.Length; i++)
        {
            var row = new TableRow();
            var tc1Pr = new TableCellProperties(new TableCellWidth { Width = "2700", Type = TableWidthUnitValues.Dxa });
            if (i % 2 == 1) tc1Pr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
            row.Append(new TableCell(tc1Pr,
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = Navy }), new Text(meta[i].label))
                )
            ));
            var tc2Pr = new TableCellProperties(new TableCellWidth { Width = "6326", Type = TableWidthUnitValues.Dxa });
            if (i % 2 == 1) tc2Pr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
            row.Append(new TableCell(tc2Pr,
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new Text(meta[i].value))
                )
            ));
            t.Append(row);
        }
        return t;
    }

    // ─────────────────────── HELPERS ───────────────────────
    private static void Title(Body body, string text)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "240", After = "60", Line = "240", LineRule = LineSpacingRuleValues.Auto }
            ),
            new Run(
                new RunProperties(
                    new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri" },
                    new FontSize { Val = "44" },
                    new FontSizeComplexScript { Val = "44" },
                    new Color { Val = Navy },
                    new Bold()
                ),
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
    }

    private static void Subtitle(Body body, string text)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360", Line = "300", LineRule = LineSpacingRuleValues.Auto }
            ),
            new Run(
                new RunProperties(
                    new FontSize { Val = "24" },
                    new FontSizeComplexScript { Val = "24" },
                    new Color { Val = Teal },
                    new Italic()
                ),
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
    }

    private static void SectionHeader(Body body, string text)
    {
        // Numbered section header in navy, bold, with a thin teal top border
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "360", After = "120" },
                new ParagraphBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 4, Space = 8, Color = Teal }
                )
            ),
            new Run(
                new RunProperties(
                    new FontSize { Val = "26" },
                    new Color { Val = Navy },
                    new Bold()
                ),
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
    }

    private static void StackHeader(Body body, string text)
    {
        // All-caps stack header with a light fill, mimicking the example's "COGNITIVE STACK" feel
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "280", After = "100" },
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = SectionFill },
                new Indentation { Left = "120", Right = "120" }
            ),
            new Run(
                new RunProperties(
                    new FontSize { Val = "20" },
                    new Color { Val = Teal },
                    new Bold(),
                    new Spacing { Val = 30 }
                ),
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
    }

    private static void Para(Body body, string text)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(),
            new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve })
        ));
    }

    private static void BulletList(Body body, string[] items)
    {
        foreach (var item in items)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(
                    new Indentation { Left = "360", Hanging = "180" },
                    new SpacingBetweenLines { After = "60" }
                ),
                new Run(new RunProperties(new Color { Val = Teal }, new Bold()), new Text("•  ") { Space = SpaceProcessingModeValues.Preserve }),
                new Run(new Text(item) { Space = SpaceProcessingModeValues.Preserve })
            ));
        }
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
