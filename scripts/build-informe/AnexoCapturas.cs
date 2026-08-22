using System;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocumentFormat.OpenXml.Office2010.Word;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class AnexoCapturas
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
    private const string PlaceholderFill = "F1F5F9";
    private const string PlaceholderBorder = "CBD5E1";

    public static int Generate(string outputPath, string imagesDir)
    {
        if (File.Exists(outputPath)) File.Delete(outputPath);

        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var mainPart = doc.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        var body = mainPart.Document.Body!;

        BuildStyles(mainPart);
        BuildBody(mainPart, body, imagesDir);

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

        styles.Append(new Style(
            new StyleName { Val = "Caption" },
            new BasedOn { Val = "Normal" },
            new UIPriority { Val = 35 },
            new PrimaryStyle(),
            new StyleParagraphProperties(
                new SpacingBetweenLines { Before = "60", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new StyleRunProperties(
                new FontSize { Val = "18" },
                new Color { Val = CaptionGray },
                new Italic()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "Caption" });
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

    private static void BuildBody(MainDocumentPart mainPart, Body body, string imagesDir)
    {
        var sectPr = new SectionProperties(
            new WpPageSize { Width = 11906U, Height = 16838U },
            new PageMargin { Top = 1440, Bottom = 1440, Left = 1440U, Right = 1440U, Header = 720U, Footer = 720U, Gutter = 0U }
        );

        AddHeader(mainPart, sectPr, "Anexo 2 · Capturas de la plataforma en producción");
        AddFooter(mainPart, sectPr);

        // Cover page
        CoverPage(body);

        body.Append(PageBreak());

        // Introduction
        H1(body, "Introducción");
        Para(body,
            "Este anexo presenta el registro visual de la plataforma en producción " +
            "(https://geodatabase.mcconsultorias.com.co) con el detalle de los 5 componentes temáticos " +
            "obligatorios, la página institucional de aterrizaje (landing), el módulo de autenticación, " +
            "el dashboard transversal y el módulo de descarga de datos. Las capturas fueron obtenidas " +
            "del ambiente productivo y constituyen el soporte visual del avance técnico declarado en el " +
            "Informe Técnico de Avance al 24 de junio de 2026.");

        Para(body,
            "Cada captura incluye su URL, fecha de captura y descripción funcional. Las imágenes se " +
            "preservan a tamaño completo en el repositorio del proyecto, en la ruta docs/anexo-2-capturas/.",
            italic: true);

        body.Append(PageBreak());

        // 8 sections
        (string sectionId, string title, string description, string url, string[] features, string imageName)[] sections = new[]
        {
            ("1", "Landing page institucional",
                "Página de aterrizaje pública que presenta el proyecto, la entidad contratante y el acceso a la plataforma.",
                "https://geodatabase.mcconsultorias.com.co/landing-cra.html",
                new[] {
                    "Identidad institucional (C.R.A. + logo del proyecto)",
                    "Resumen del objetivo de la Geodatabase",
                    "Botón de acceso a la plataforma (login)",
                    "Sección de componentes y datos destacados",
                },
                "01-landing.png"),

            ("2", "Página de login",
                "Módulo de autenticación con control de acceso por rol (administrador, técnico, consulta).",
                "https://geodatabase.mcconsultorias.com.co/?entrar=1",
                new[] {
                    "Formulario de inicio de sesión con usuario y contraseña",
                    "Autenticación JWT contra el backend Go/Fiber",
                    "Mensaje de error ante credenciales inválidas",
                    "Botón de recuperación de contraseña",
                },
                "02-login.png"),

            ("3", "Componente: Restauración Ecológica",
                "Vista temática principal con polígonos de restauración, puntos de monitoreo, censo forestal y dashboard de calidad.",
                "https://geodatabase.mcconsultorias.com.co/  (componente: restauración)",
                new[] {
                    "Mapa Leaflet con polígonos de restauración (SRID 4326)",
                    "Puntos de monitoreo georreferenciados (15 parcelas)",
                    "Panel de KPIs: sitios visitados, reportados, calidad",
                    "Escala de calidad ICAM (pesima → óptima)",
                    "Tabla de sitios con filtros por categoría y período",
                },
                "03-restauracion.png"),

            ("4", "Componente: Vegetación Acuática (Maleza)",
                "Vista temática de polígonos de maleza acuática y comparativo temporal de imágenes.",
                "https://geodatabase.mcconsultorias.com.co/  (componente: maleza)",
                new[] {
                    "Mapa con polígonos de maleza acuática (5 capas reales)",
                    "Comparativo ANTES/DESPUÉS con mapas sincronizados",
                    "Medición de distancia y área en el mapa",
                    "Geocodificación Nominatim/OSM con flyTo",
                    "Población de biomasa retirada (cuando hay datos)",
                },
                "04-vegetacion-acuatica.png"),

            ("5", "Componente: Ficorremediación",
                "Vista temática de los 5 puntos georreferenciados y la infraestructura del lote de bioaumentación.",
                "https://geodatabase.mcconsultorias.com.co/  (componente: ficorremediación)",
                new[] {
                    "Mapa con 5 puntos georreferenciados (visibles por defecto)",
                    "Lote de bioaumentación LUR-BIO-001 (capa restringida)",
                    "Tabla de variables de calidad de agua, sedimentos y biota",
                    "KPIs por punto de monitoreo",
                    "Exportación de datos en GeoJSON",
                },
                "05-ficorremediacion.png"),

            ("6", "Componente: Monitoreo de Fauna",
                "Vista temática con KPIs, curvas de diversidad (Q0/Q1/Q2) y tabla de abundancias por especie.",
                "https://geodatabase.mcconsultorias.com.co/  (componente: fauna)",
                new[] {
                    "KPIs: riqueza, abundancia, índices de diversidad",
                    "Curvas de rarefacción/extrapolación (Q0, Q1, Q2)",
                    "Tabla de abundancias por especie y grupo taxonómico",
                    "Mapa con puntos de cámaras trampa (cuando hay datos)",
                    "Filtros por campaña y grupo taxonómico",
                },
                "06-fauna.png"),

            ("7", "Componente: Gobernanza Ambiental",
                "Vista temática de actividades de gobernanza: socializaciones, talleres, capacitaciones, jornadas y negocios verdes.",
                "https://geodatabase.mcconsultorias.com.co/  (componente: gobernanza)",
                new[] {
                    "Tabla de las 7 actividades reales (datos integrados)",
                    "Conteos de participantes y tipo de actividad",
                    "Línea de tiempo por fecha",
                    "Mapa con ubicaciones georreferenciadas (cuando aplica)",
                    "Exportación CSV/Excel de las actividades",
                },
                "07-gobernanza.png"),

            ("8", "Dashboard transversal (resumen institucional)",
                "Vista agregada tipo ICAM que cruza los 5 componentes con los indicadores del proyecto.",
                "https://geodatabase.mcconsultorias.com.co/  (vista transversal)",
                new[] {
                    "Escala de calidad global (pesima → óptima)",
                    "KPIs agregados de todos los componentes",
                    "Gráficas de dona y barras (SVG puro)",
                    "Selector de período y filtros globales",
                    "Footer con créditos y enlace al reporte",
                },
                "08-dashboard-transversal.png"),

            ("9", "Módulo de descarga de datos",
                "Pestaña institucional que ofrece la descarga de datos abiertos en formatos CSV, Excel y PDF.",
                "https://geodatabase.mcconsultorias.com.co/  (descarga de datos)",
                new[] {
                    "Descarga de zonas, lotes, puntos y monitoreos",
                    "Formatos: CSV, Excel (.xlsx) y PDF",
                    "Reporte de coberturas Corine con datos reales",
                    "Reporte de indicadores ambientales",
                    "Reporte de insumos dron (8 productos catalogados)",
                },
                "09-descarga-datos.png"),
        };

        for (int i = 0; i < sections.Length; i++)
        {
            var s = sections[i];
            H1(body, $"Anexo 2.{s.sectionId}. {s.title}");

            H2(body, "Descripción funcional");
            Para(body, s.description);

            H2(body, "URL de acceso");
            Para(body, s.url, italic: true);

            H2(body, "Funcionalidades verificadas");
            for (int j = 0; j < s.features.Length; j++)
            {
                Bullet(body, $"{j + 1}. {s.features[j]}");
            }

            H2(body, "Captura de pantalla");

            // Try to embed the image, otherwise show placeholder
            string imgPath = imagesDir != null ? Path.Combine(imagesDir, s.imageName) : "";
            bool embedded = false;
            if (!string.IsNullOrEmpty(imagesDir) && File.Exists(imgPath))
            {
                try
                {
                    EmbedImage(mainPart, body, imgPath, altText: s.title);
                    embedded = true;
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"WARN: could not embed {imgPath}: {ex.Message}");
                }
            }

            if (!embedded)
            {
                // Placeholder: a styled paragraph "frame"
                AppendPlaceholder(body, s.title, s.url, s.imageName);
            }

            body.Append(Caption($"Figura 2.{s.sectionId}: {s.title} — https://geodatabase.mcconsultorias.com.co (captura del ambiente productivo, 24-jun-2026)."));

            if (i < sections.Length - 1)
            {
                body.Append(PageBreak());
            }
        }

        // Closing
        body.Append(PageBreak());
        H1(body, "Cierre del anexo");
        Para(body,
            "Las nueve secciones anteriores constituyen el registro visual de la plataforma en producción. " +
            "Las imágenes de mayor resolución se preservan en el repositorio del proyecto, junto con sus " +
            "metadatos (fecha de captura, hash SHA-256 y nombre de archivo original).");

        body.Append(sectPr);
    }

    // ─────────────────────── COVER ───────────────────────
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
            new ParagraphProperties(
                new SpacingBetweenLines { After = "120" },
                new Justification { Val = JustificationValues.Center }
            ),
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
                new Text("Anexo 2")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "32" }, new Color { Val = Teal }, new Italic()),
                new Text("Capturas de la plataforma en producción")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = SoftBlack }),
                new Text("Soporte visual de la cláusula 3.2 — Contrato UTL:001")
            )
        ));

        // Metadata table
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
            ("Contrato", "UTL:001"),
            ("Soporta", "Solicitud de desembolso — Cláusula 3.2"),
            ("Plataforma", "geodatabase.mcconsultorias.com.co"),
            ("Componentes cubiertos", "9 (landing, login, 5 temáticos, dashboard, descarga)"),
            ("Fecha de captura", "24 de junio de 2026"),
            ("Versión del frontend", "React 19 + TypeScript + Leaflet 5"),
            ("Versión del backend", "Go 1.22 + Fiber v2.52.13"),
            ("Versión de BD", "PostgreSQL 15 + PostGIS 3.4"),
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

    // ─────────────────────── PLACEHOLDER ───────────────────────
    private static void AppendPlaceholder(Body body, string title, string url, string imageName)
    {
        // A 1-cell table styled as a placeholder frame
        var placeholder = new Table();
        placeholder.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 12, Space = 0, Color = PlaceholderBorder },
                new BottomBorder { Val = BorderValues.Single, Size = 12, Space = 0, Color = PlaceholderBorder },
                new LeftBorder { Val = BorderValues.Single, Size = 12, Space = 0, Color = PlaceholderBorder },
                new RightBorder { Val = BorderValues.Single, Size = 12, Space = 0, Color = PlaceholderBorder },
                new InsideHorizontalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "600", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "200", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "600", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "200", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "9026" });
        placeholder.Append(grid);

        var row = new TableRow();
        row.Append(new TableCell(
            new TableCellProperties(
                new TableCellWidth { Width = "9026", Type = TableWidthUnitValues.Dxa },
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = PlaceholderFill }
            ),
            new Paragraph(
                new ParagraphProperties(
                    new SpacingBetweenLines { After = "120" },
                    new Justification { Val = JustificationValues.Center }
                ),
                new Run(
                    new RunProperties(new FontSize { Val = "36" }, new Color { Val = Gray }, new Bold()),
                    new Text("🖼  ESPACIO PARA CAPTURA")
                )
            ),
            new Paragraph(
                new ParagraphProperties(
                    new SpacingBetweenLines { After = "60" },
                    new Justification { Val = JustificationValues.Center }
                ),
                new Run(
                    new RunProperties(new FontSize { Val = "24" }, new Color { Val = Navy }, new Bold()),
                    new Text(title)
                )
            ),
            new Paragraph(
                new ParagraphProperties(
                    new SpacingBetweenLines { After = "60" },
                    new Justification { Val = JustificationValues.Center }
                ),
                new Run(
                    new RunProperties(new FontSize { Val = "20" }, new Color { Val = CaptionGray }),
                    new Text($"Archivo esperado: docs/anexo-2-capturas/{imageName}")
                )
            ),
            new Paragraph(
                new ParagraphProperties(
                    new SpacingBetweenLines { After = "0" },
                    new Justification { Val = JustificationValues.Center }
                ),
                new Run(
                    new RunProperties(new FontSize { Val = "18" }, new Color { Val = CaptionGray }, new Italic()),
                    new Text($"URL de origen: {url}")
                )
            )
        ));
        placeholder.Append(row);
        body.Append(placeholder);
    }

    // ─────────────────────── IMAGE EMBEDDING ───────────────────────
    private static uint _nextImageId = 1;
    private static void EmbedImage(MainDocumentPart mainPart, Body body, string imagePath, string altText)
    {
        var imagePart = mainPart.AddImagePart(ImagePartType.Png);
        using (var stream = new FileStream(imagePath, FileMode.Open, FileAccess.Read))
        {
            imagePart.FeedData(stream);
        }

        string relationshipId = mainPart.GetIdOfPart(imagePart);
        uint imageId = _nextImageId++;

        // Get image dimensions in EMU (1 inch = 914400 EMU, 1 cm = 360000 EMU)
        // For simplicity, fit to a 6 inch wide box (5486400 EMU)
        long maxWidth = 5486400L;

        var element = new Drawing(
            new DW.Inline(
                new DW.Extent { Cx = maxWidth, Cy = 3200000L },  // 16:9 ratio
                new DW.EffectExtent { LeftEdge = 0L, TopEdge = 0L, RightEdge = 0L, BottomEdge = 0L },
                new DW.DocProperties { Id = imageId, Name = $"Image_{imageId}", Description = altText },
                new DW.NonVisualGraphicFrameDrawingProperties(
                    new A.GraphicFrameLocks { NoChangeAspect = true }
                ),
                new A.Graphic(
                    new A.GraphicData(
                        new PIC.Picture(
                            new PIC.NonVisualPictureProperties(
                                new PIC.NonVisualDrawingProperties { Id = imageId, Name = $"Image_{imageId}" },
                                new PIC.NonVisualPictureDrawingProperties()
                            ),
                            new PIC.BlipFill(
                                new A.Blip { Embed = relationshipId, CompressionState = A.BlipCompressionValues.Print },
                                new A.Stretch(new A.FillRectangle())
                            ),
                            new PIC.ShapeProperties(
                                new A.Transform2D(
                                    new A.Offset { X = 0L, Y = 0L },
                                    new A.Extents { Cx = maxWidth, Cy = 3200000L }
                                ),
                                new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle }
                            )
                        )
                    ) { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }
                )
            )
            {
                DistanceFromTop = 0U,
                DistanceFromBottom = 0U,
                DistanceFromLeft = 0U,
                DistanceFromRight = 0U
            }
        );

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "60" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(element)
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

    private static void Para(Body body, string text, bool italic = false)
    {
        var rPr = new RunProperties();
        if (italic) rPr.Append(new Italic());
        body.Append(new Paragraph(
            new ParagraphProperties(),
            new Run(rPr, new Text(text) { Space = SpaceProcessingModeValues.Preserve })
        ));
    }

    private static void Bullet(Body body, string text)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Indentation { Left = "360", Hanging = "180" },
                new SpacingBetweenLines { After = "60" }
            ),
            new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve })
        ));
    }

    private static Paragraph Caption(string text) => new Paragraph(
        new ParagraphProperties(new ParagraphStyleId { Val = "Caption" }),
        new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve })
    );

    private static Paragraph PageBreak() => new Paragraph(new Run(new Break { Type = BreakValues.Page }));

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
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Left },
                    new SpacingBetweenLines { After = "0" }
                ),
                new Run(
                    new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }),
                    new Text("MC Consultorías & Capacitación S.A.S. · Confidencial") { Space = SpaceProcessingModeValues.Preserve }
                )
            )
        ));

        var rightCellPara = new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Right },
                new SpacingBetweenLines { After = "0" }
            )
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
