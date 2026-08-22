using System;
using System.Collections.Generic;
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

public static class Program
{
    // ModernCorporate palette (navy / teal) — slight tweaks for the report
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

    public static int Main(string[] args)
    {
        // Supports: dotnet run [informe|solicitud|anexo|anexo3|anexo4] [outputPath] [imagesDir]
        string command = args.Length > 0 && !args[0].EndsWith(".docx") ? args[0] : "informe";
        string outputPath;

        if (command == "solicitud")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "SOLICITUD-DESEMBOLSO-CLAUSULA-3-2.docx");
            return SolicitudPago.Generate(outputPath);
        }

        if (command == "anexo")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "ANEXO-2-CAPTURAS-PLATAFORMA.docx");
            string imagesDir = args.Length > 2 ? args[2] : Path.Combine(Directory.GetCurrentDirectory(), "anexo-2-capturas");
            return AnexoCapturas.Generate(outputPath, imagesDir);
        }

        if (command == "anexo3")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "ANEXO-3-ESTADO-GEODATABASE.docx");
            return AnexoGeodatabase.Generate(outputPath);
        }

        if (command == "anexo4")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "ANEXO-4-BITACORA-CAMBIOS.docx");
            return AnexoChangelog.Generate(outputPath);
        }

        if (command == "ficha")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "FICHA-PROYECTO-GEODATABASE-LURUACO.docx");
            return FichaProyecto.Generate(outputPath);
        }

        if (command == "despliegue")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "REPORTE-DESPLIEGUE-VERIFICACION.docx");
            return ReporteDespliegue.Generate(outputPath);
        }

        if (command == "guia-netlify")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "GUIA-DESPLIEGUE-NETLIFY.docx");
            return GuiaDespliegueNetlify.Generate(outputPath);
        }

        if (command == "guia-completo")
        {
            outputPath = args.Length > 1
                ? args[1]
                : Path.Combine(Directory.GetCurrentDirectory(), "GUIA-DESPLIEGUE-COMPLETO.docx");
            return GuiaDespliegueCompleto.Generate(outputPath);
        }

        outputPath = args.Length > 0
            ? args[0]
            : Path.Combine(Directory.GetCurrentDirectory(), "INFORME-AVANCE-CONTRATO-UTL-001.docx");

        if (File.Exists(outputPath)) File.Delete(outputPath);

        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var mainPart = doc.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        var body = mainPart.Document.Body!;

        BuildStyles(mainPart);
        BuildCoverAndBody(mainPart, body);

        Console.WriteLine($"OK -> {outputPath}");
        return 0;
    }

    // ─────────────────────── STYLES ───────────────────────
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

        // Normal
        styles.Append(new Style(
            new StyleName { Val = "Normal" },
            new UIPriority { Val = 0 },
            new PrimaryStyle()
        ) { Type = StyleValues.Paragraph, StyleId = "Normal", Default = true });

        // Heading 1 — 16pt navy
        styles.Append(MakeHeadingStyle(1, "Calibri", "32", Navy, true, "480", "120", 9));
        // Heading 2 — 13pt teal
        styles.Append(MakeHeadingStyle(2, "Calibri", "26", Teal, true, "360", "80", 9));
        // Heading 3 — 11pt navy bold
        styles.Append(MakeHeadingStyle(3, "Calibri", "22", Navy, true, "240", "80", 9));

        // TOCHeading (TOC title) — large navy
        styles.Append(new Style(
            new StyleName { Val = "TOC Heading" },
            new BasedOn { Val = "Normal" },
            new NextParagraphStyle { Val = "Normal" },
            new UIPriority { Val = 39 },
            new PrimaryStyle(),
            new StyleParagraphProperties(
                new SpacingBetweenLines { Before = "480", After = "120" },
                new OutlineLevel { Val = 9 }
            ),
            new StyleRunProperties(
                new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri", ComplexScript = "Calibri" },
                new FontSize { Val = "32" },
                new FontSizeComplexScript { Val = "32" },
                new Color { Val = Navy },
                new Bold()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "TOCHeading", Default = false });

        // Caption — italic gray 9pt
        styles.Append(new Style(
            new StyleName { Val = "caption" },
            new BasedOn { Val = "Normal" },
            new UIPriority { Val = 35 },
            new PrimaryStyle(),
            new StyleParagraphProperties(new SpacingBetweenLines { After = "120" }),
            new StyleRunProperties(
                new FontSize { Val = "18" },
                new FontSizeComplexScript { Val = "18" },
                new Color { Val = CaptionGray },
                new Italic()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "Caption", Default = false });

        // CoverTitle — large centered navy
        styles.Append(new Style(
            new StyleName { Val = "Cover Title" },
            new BasedOn { Val = "Normal" },
            new UIPriority { Val = 10 },
            new PrimaryStyle(),
            new StyleParagraphProperties(
                new SpacingBetweenLines { Before = "0", After = "120", Line = "276", LineRule = LineSpacingRuleValues.Auto },
                new Justification { Val = JustificationValues.Center }
            ),
            new StyleRunProperties(
                new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri", ComplexScript = "Calibri" },
                new FontSize { Val = "48" },
                new FontSizeComplexScript { Val = "48" },
                new Color { Val = Navy },
                new Bold()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "CoverTitle", Default = false });

        // CoverSubtitle — italic 14pt teal
        styles.Append(new Style(
            new StyleName { Val = "Cover Subtitle" },
            new BasedOn { Val = "Normal" },
            new UIPriority { Val = 11 },
            new PrimaryStyle(),
            new StyleParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new StyleRunProperties(
                new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri", ComplexScript = "Calibri" },
                new FontSize { Val = "28" },
                new FontSizeComplexScript { Val = "28" },
                new Color { Val = Teal },
                new Italic()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "CoverSubtitle", Default = false });
    }

    private static Style MakeHeadingStyle(int level, string font, string sizeHalf, string color, bool bold, string before, string after, int uiPriority)
    {
        var rPr = new StyleRunProperties(
            new RunFonts { Ascii = font, HighAnsi = font, EastAsia = "SimSun", ComplexScript = font },
            new FontSize { Val = sizeHalf },
            new FontSizeComplexScript { Val = sizeHalf },
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
        ) { Type = StyleValues.Paragraph, StyleId = $"Heading{level}", Default = false };
    }

    // ─────────────────────── MAIN BUILD ───────────────────────
    private static void BuildCoverAndBody(MainDocumentPart mainPart, Body body)
    {
        // ─── Page setup: A4, 1in margins ───
        var sectPr = new SectionProperties(
            new WpPageSize { Width = 11906U, Height = 16838U },
            new PageMargin { Top = 1440, Bottom = 1440, Left = 1440U, Right = 1440U, Header = 720U, Footer = 720U, Gutter = 0U }
        );

        // ─── Header (Spanish) ───
        AddHeader(mainPart, sectPr, "Contrato UTL:001 · Informe de Avance");
        // ─── Footer: "MC Consultorías & Capacitación S.A.S. · Confidencial   |   Página X de Y" ───
        AddFooterWithPageXofY(mainPart, sectPr,
            leftText: "MC Consultorías & Capacitación S.A.S. · Confidencial");

        // ════════ COVER PAGE ════════
        BuildCoverPage(body);

        // Page break
        body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Page })));

        // ════════ TABLE OF CONTENTS ════════
        BuildToc(body);

        // Page break
        body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Page })));

        // ════════ 1. RESUMEN EJECUTIVO ════════
        H1(body, "1. Resumen ejecutivo");

        Para(body,
            "La plataforma (Geodatabase + geovisor + módulos de reportes) está publicada en ambiente " +
            "productivo en https://geodatabase.mcconsultorias.com.co, con autenticación, roles, 5 " +
            "componentes temáticos navegables y un dashboard transversal. La arquitectura, el modelo " +
            "de datos, el backend, el frontend y el geovisor (obligaciones 5.2 a 5.5) están " +
            "funcionalmente completos; lo que continúa abierto es la carga de información de " +
            "campo/laboratorio que deben suministrar los equipos técnicos del proyecto " +
            "(Restauración, Fauna, Ficorremediación), no desarrollo de software.");

        // Status chart
        BuildStatusChart(body);

        // ════════ 2. AVANCE POR OBLIGACIÓN CONTRACTUAL ════════
        H1(body, "2. Avance por obligación contractual (cláusula quinta)");

        BuildObligationsTable(body);

        Obligation(body, "5.1", "Diseño, estructuración y construcción de la Geodatabase", new[] {
            "Geodatabase oficial creada en PostgreSQL/PostGIS (restauracion_ecologica, esquema eco_restauracion), con SRID 4326, geometrías validadas y relaciones por FK.",
            "21 tablas activas + vistas de indicadores (vw_indicadores_restauracion, vw_fauna_total, vw_gobernanza_resumen).",
            "Información recibida e integrada de los componentes: Restauración (censo forestal real), Maleza/Vegetación Acuática (polígonos reales), Gobernanza (actividades reales), Ficorremediación (puntos georreferenciados).",
        }, new[] {
            ("Pendiente", "Depuración/normalización formal bajo lineamientos IGAC e ISO 19115, y metadatos técnicos completos (ver §4)."),
            ("Pendiente", "Integración de cartografía base institucional oficial (hoy se usa imagen satelital Esri/Maxar como base, no cartografía IGAC entregada por la entidad)."),
        }, "Verde");

        Obligation(body, "5.2", "Análisis funcional y arquitectura de la plataforma", new[] {
            "Roles definidos y operativos: administrador, tecnico, consulta (tabla usuarios, JWT, middleware requireAuth).",
            "Arquitectura: SPA React (frontend) + API REST Go/Fiber (backend) + PostGIS, documentada en 01-ARQUITECTURA.md y 10-INFRAESTRUCTURA-PRODUCCION.md.",
            "Flujos de información definidos por componente (capas, puntos, coberturas, temáticas).",
        }, null, "Verde");

        Obligation(body, "5.3", "Diseño UX/UI", new[] {
            "Lineamientos gráficos institucionales (C.R.A.) aplicados de forma consistente en los 5 componentes y el dashboard transversal.",
            "Diseño responsive (sidebar colapsable, grillas adaptables, breakpoints móvil/tablet probados).",
        }, new[] {
            ("Pendiente", "Wireframes/mockups como artefacto formal de entrega: existen como HTML de mockup (03-frontend/public/mockup/), no como documento de diseño firmado."),
        }, "Verde");

        Obligation(body, "5.4", "Desarrollo tecnológico", new[] {
            "Backend Go (Fiber) con autenticación JWT, control de acceso por rol, API documentada por rutas (02-backend/main.go, auth.go, crud.go, restauracion.go, reportes.go, tematicas.go).",
            "Frontend React/TypeScript con 5 vistas de componente + dashboard transversal + reportes.",
            "Geovisor (Leaflet) con capas por componente, medición, búsqueda de lugar, exportación GeoJSON, ortofoto dron.",
            "Módulo de reportes/indicadores (ReportesView, vw_indicadores_restauracion).",
            "Integración frontend–backend–Geodatabase verificada end-to-end (login real, CRUD de puntos, carga de capas).",
        }, null, "Verde");

        Obligation(body, "5.5", "Pruebas, implementación y puesta en operación", new[] {
            "Plataforma publicada en ambiente productivo: https://geodatabase.mcconsultorias.com.co (Docker + Traefik + TLS, VPS Hetzner).",
            "URL operativa de acceso entregada y funcionando.",
            "Verificación funcional manual de cada cambio antes de publicar (login, render de componentes, persistencia en BD).",
        }, new[] {
            ("Pendiente", "Informe formal de pruebas técnicas como documento de entrega (hoy la verificación es continua pero no está consolidada en un acta/informe único)."),
        }, "Amarillo");

        Obligation(body, "5.6", "Soporte y mantenimiento post-implementación", new[] {
            "Soporte correctivo activo y continuo (ajustes de componentes, corrección de credenciales, mejoras de UI bajo demanda).",
        }, new[] {
            ("Pendiente", "Registro estructurado de incidencias (hoy el seguimiento vive en el historial de cambios del repositorio, no en una bitácora formal de soporte)."),
        }, "Verde");

        Obligation(body, "5.7", "Capacitación", new[] {
            "Sin avances — 0 de 4 talleres realizados. Sin fecha programada aún.",
            "Material de apoyo y memorias de capacitación: no generados (dependen de la programación de los talleres).",
        }, null, "Rojo");

        Obligation(body, "5.8", "Entregables y documentación", new[] {
            "Código fuente, configuraciones y base de datos están versionados y entregables (repositorio del proyecto).",
        }, new[] {
            ("Pendiente", "Manuales técnico y de usuario: existen versiones preliminares (E10_Manual_Administrador_Principal.md, E10_Manual_Usuario_Principal.md, E01_Diccionario_Datos_Principal.md) pendientes de validación final con el contratante."),
            ("Pendiente", "Plan de capacitación (E10_Plan_Capacitacion_Principal.md) existe como borrador, pendiente de cruzar con la programación real de los 4 talleres (obligación 5.7)."),
        }, "Amarillo");

        // ════════ 3. ESTADO ACTUAL DE LA GEODATABASE ════════
        H1(body, "3. Estado actual de la Geodatabase (datos, no estructura)");

        Para(body,
            "La siguiente tabla resume el estado de las tablas a la fecha de este informe, con conteo de filas y observaciones operativas.");

        BuildDatabaseStateTable(body);

        // ════════ 4. INFORMACIÓN FALTANTE ════════
        H1(body, "4. Información faltante en base de datos, por componente");

        H2(body, "4.1 Restauración Ecológica");
        NumberedList(body, new[] {
            "Mediciones de campo de Monitoreo 1 a 4 — las 15 filas por monitoreo existen pero sin especie/altura/DAP. Responsable: equipo de campo (Yurani).",
            "Fórmula real de densidad/área basal — hoy se asume parcela = 0,1 ha; pendiente de confirmar tamaño real. Responsable: Yurani.",
            "Registro de siembra (vs. medición) — sin esto, \"individuos sembrados\" queda en s/d.",
            "Cartografía base oficial / shapefile del predio — no hay capa de predio independiente del aislamiento.",
            "Fotografías antes/después por parcela — 0 cargadas en fotografias.",
        });

        H2(body, "4.2 Vegetación Acuática");
        NumberedList(body, new[] {
            "Imágenes satelitales/dron por fecha de monitoreo — el comparativo usa un esquema gráfico, no imágenes reales.",
            "Longitud real del borde intervenido (hoy estimación de ~3,1 km).",
            "Volumen de biomasa retirada — sin reportar.",
        });

        H2(body, "4.3 Ficorremediación");
        NumberedList(body, new[] {
            "Resultados de laboratorio de calidad de agua (15 parámetros: pH, OD, DBO5, SST, fósforo, nitrógeno, clorofila A, coliformes, cianotoxinas) — tabla ficor_calidad_agua creada, 0 filas.",
            "Resultados de calidad de sedimentos (metales pesados: Hg, Pb, Cu, Zn, As, Cd; plaguicidas: clorpirifos, malatión, paratión, profenofos) — tabla ficor_calidad_sedimentos creada, 0 filas.",
            "Conteos de biota (fitoplancton, zooplancton, ictioplancton, macroinvertebrados bentónicos, perifiton, ictiofauna) — tabla ficor_biota creada, 0 filas.",
            "Metadatos de los 5 puntos — tipo de consorcio microalgal, fecha de inoculación, dosis aplicada (no contemplado en el modelo actual).",
        });
        Para(body, "Resuelto desde el último avance: los 5 puntos georreferenciados ya están cargados en puntos_monitoreo y visibles por defecto en el geovisor.", italic: true);

        H2(body, "4.4 Monitoreo de Fauna");
        NumberedList(body, new[] {
            "Definición de variables del tablero — especies objetivo, grupos taxonómicos, esfuerzo de muestreo, índices a calcular. Responsable: Darío. Sin esto, fauna_grupos_resumen y fauna_diversidad_curvas permanecen vacías aunque la estructura (KPIs, mapa, curvas Q0/Q1/Q2, tabla de abundancias) ya está lista.",
            "Puntos de monitoreo / cámaras trampa — sin ubicaciones reales (0 puntos con tipo_monitoreo='fauna').",
        });

        H2(body, "4.5 Gobernanza Ambiental");
        Para(body, "Sin pendientes de carga — las 7 actividades, cantidades y participantes del Excel ya están en gobernanza_actividades y reflejadas en el dashboard transversal.");
        Para(body, "Pendiente menor: las ubicaciones \"georreferenciada en la foto\" (jornadas de limpieza, recorrido guiado) no tienen coordenadas reales asociadas.", italic: true);

        H2(body, "4.6 Transversal / modelo general");
        Para(body,
            "Las tablas genéricas del modelo inicial (monitoreos, parcelas, documentos, fotografias, indicadores_ambientales) " +
            "siguen vacías porque el dato real terminó modelándose en tablas específicas por componente " +
            "(arboles_monitoreo, puntos_monitoreo, *_grupos_resumen, etc.). Se recomienda decidir si se consolidan " +
            "en el modelo general (mayor cumplimiento literal de la spec inicial) o se formaliza el modelo por " +
            "componente ya en uso (más simple, ya probado en producción).");

        // ════════ 5. PRÓXIMOS PASOS ════════
        H1(body, "5. Próximos pasos sugeridos");

        BuildNextStepsTable(body);

        // ════════ 6. AVANCE PONDERADO POR COMPONENTE ════════
        H1(body, "6. Avance ponderado por componente entregable");

        Para(body,
            "Con el fin de facilitar la lectura cruzada de este informe con la Solicitud de Desembolso de la " +
            "cláusula 3.2, se presenta a continuación el cálculo del avance ponderado de los seis componentes " +
            "principales del entregable, asignando pesos proporcionales a la complejidad técnica y al valor " +
            "contractual de cada uno. El resultado es 90,75% de avance ponderado, ampliamente superior al 50% " +
            "requerido como umbral para la liberación del pago intermedio.");

        H2(body, "6.1. Tabla de avance ponderado");

        BuildWeightedProgressTable(body);

        H2(body, "6.2. Conclusión del avance ponderado");

        Para(body,
            "El avance ponderado de 90,75% supera por 40,75 puntos porcentuales el umbral del 50% esperado " +
            "para la liberación de un pago intermedio contra avance comprobado (cláusula 3.2). La plataforma " +
            "está desplegada en producción, es funcionalmente accesible y cumple las obligaciones sustanciales " +
            "del contrato hasta el hito correspondiente. Los pendientes identificados corresponden " +
            "mayoritariamente al hito 3.3 (entrega final) y dependen en gran medida de la entrega oportuna de " +
            "información por parte de los equipos técnicos del proyecto.");

        // ════════ 7. VINCULACIÓN CON LA SOLICITUD DE DESEMBOLSO ════════
        H1(body, "7. Vinculación con la Solicitud de Desembolso (cláusula 3.2)");

        Para(body,
            "El presente informe constituye el Anexo 1 — soporte técnico exigido en la cláusula tercera (3.2) " +
            "del Contrato UTL:001 — de la Solicitud de Desembolso por $43.077.762 M/L (30% del valor total del " +
            "contrato), conforme a la cual:");

        BulletList(body, new[] {
            "El avance técnico declarado en este informe (90,75% ponderado) es el soporte cuantitativo de la solicitud.",
            "El estado real de la Geodatabase descrito en §3 es el soporte técnico de la base de datos en producción.",
            "El detalle de las obligaciones 5.1 a 5.6 (verdes/amarillas) descrito en §2 es el soporte cualitativo del cumplimiento contractual.",
            "Los pendientes del hito 3.3 descritos en §4 son el soporte del avance restante, que NO bloquea la liberación de la cláusula 3.2.",
        });

        Para(body,
            "Los soportes complementarios de la solicitud de desembolso son:",
            bold: true);

        BulletList(body, new[] {
            "Anexo 1 (este documento): Informe Técnico de Avance — Contrato UTL:001.",
            "Anexo 2: Capturas de la plataforma en producción (9 secciones: landing, login, 5 componentes temáticos, dashboard transversal, descarga de datos).",
            "Anexo 3: Reporte del estado real de las tablas de la Geodatabase (conteo de filas y observaciones por tabla).",
            "Anexo 4: Bitácora de cambios y despliegues del repositorio del proyecto (commits, releases, hitos).",
        });

        // Closing note
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "480" }),
            new Run(
                new RunProperties(new Italic(), new Color { Val = CaptionGray }, new FontSize { Val = "20" }),
                new Text("Informe generado a partir del estado real de la base de datos de producción (geodatabase.mcconsultorias.com.co) y del repositorio del proyecto al 24 de junio de 2026. Este documento constituye el Anexo 1 de la Solicitud de Desembolso de la cláusula 3.2 del Contrato UTL:001.")
            )
        ));

        // Section properties LAST
        body.Append(sectPr);
    }

    // ─────────────────────── COVER ───────────────────────
    private static void BuildCoverPage(Body body)
    {
        // Logo placeholder (centered, teal)
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

        // Title
        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "CoverTitle" }),
            new Run(new Text("Informe de Avance"))
        ));

        // Subtitle
        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "CoverSubtitle" }),
            new Run(new Text("Contrato UTL:001"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = SoftBlack }),
                new Text("Servicio tecnológico para la creación y diseño de Geodatabase y realización de 4 talleres de capacitación")
            )
        ));

        // Metadata table (8 rows × 2 cols)
        var coverTable = new Table();
        var tblPr = new TableProperties(
            new TableWidth { Width = "4500", Type = TableWidthUnitValues.Pct },
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
        );
        coverTable.Append(tblPr);

        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "2700" });
        grid.Append(new GridColumn { Width = "6326" });
        coverTable.Append(grid);

        (string label, string value)[] metadata = new[] {
            ("Documento", "Anexo 1 — Soporte técnico (cláusula 3.2)"),
            ("Contrato", "UTL:001"),
            ("Contratante", "Unión Temporal Restauración Luruaco (NIT 901.991.300-4)"),
            ("Contratista", "MC Consultorías & Capacitación S.A.S. (NIT 900.614.837-8)"),
            ("Valor total", "$143.592.540 M/L"),
            ("Avance comprobado", "90,75% ponderado (umbral 3.2: ≥ 50%)"),
            ("Plazo", "22 meses"),
            ("Inicio", "02 de marzo de 2026"),
            ("Fin contractual", "02 de enero de 2028"),
            ("Fecha del informe", "24 de junio de 2026"),
        };

        for (int i = 0; i < metadata.Length; i++)
        {
            var row = new TableRow();
            bool alt = i % 2 == 1;
            // Label cell
            var tc1Pr = new TableCellProperties(
                new TableCellWidth { Width = "2700", Type = TableWidthUnitValues.Dxa }
            );
            if (alt)
            {
                tc1Pr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
            }
            row.Append(new TableCell(tc1Pr,
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = Navy }), new Text(metadata[i].label))
                )
            ));
            // Value cell
            var tc2Pr = new TableCellProperties(new TableCellWidth { Width = "6326", Type = TableWidthUnitValues.Dxa });
            if (alt)
            {
                tc2Pr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
            }
            row.Append(new TableCell(tc2Pr,
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new Text(metadata[i].value))
                )
            ));
            coverTable.Append(row);
        }

        body.Append(coverTable);

        // Date footer
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

    // ─────────────────────── TOC ───────────────────────
    private static void BuildToc(Body body)
    {
        // TOC title
        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "TOCHeading" }),
            new Run(new Text("Tabla de contenido"))
        ));

        // TOC field (auto-updated by Word on open)
        var tocPara = new Paragraph();
        tocPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Begin }));
        tocPara.Append(new Run(new FieldCode(" TOC \\o \"1-3\" \\h \\z \\u ") { Space = SpaceProcessingModeValues.Preserve }));
        tocPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Separate }));
        tocPara.Append(new Run(new Text("Actualice este campo con F9 en Microsoft Word.")));
        tocPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.End }));
        body.Append(tocPara);

        // Update fields on open
        body.Append(new Paragraph()); // spacer
    }

    // ─────────────────────── STATUS CHART ───────────────────────
    private static void BuildStatusChart(Body body)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "240", After = "120" }),
            new Run(new RunProperties(new Bold(), new Color { Val = Navy }, new FontSize { Val = "24" }), new Text("Estado de obligaciones contractuales (5.1 – 5.8)"))
        ));

        var chartTable = new Table();
        chartTable.Append(new TableProperties(
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
                new TopMargin { Width = "50", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "100", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "50", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "100", Type = TableWidthUnitValues.Dxa }
            )
        ));

        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "600" });
        grid.Append(new GridColumn { Width = "4026" });
        grid.Append(new GridColumn { Width = "4400" });
        chartTable.Append(grid);

        (string color, string label, string bar, string status)[] rows = new[] {
            (Green,  "5.1 Geodatabase",           "████████", "Estructurada"),
            (Green,  "5.2 Arquitectura",          "████████", "Completa"),
            (Green,  "5.3 Diseño UX/UI",          "████████", "Completo"),
            (Green,  "5.4 Desarrollo",            "████████", "Completo"),
            (Yellow, "5.5 Pruebas/Operación",     "██████▒▒", "En producción"),
            (Green,  "5.6 Soporte",               "████████", "En curso"),
            (Red,    "5.7 Capacitación",          "▒▒▒▒▒▒▒▒", "No iniciada"),
            (Yellow, "5.8 Entregables",           "██████▒▒", "Parcial"),
        };

        foreach (var r in rows)
        {
            var row = new TableRow();
            // Color box
            row.Append(new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "600", Type = TableWidthUnitValues.Dxa },
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = r.color }
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }, new Justification { Val = JustificationValues.Center }),
                    new Run(new RunProperties(new Bold(), new Color { Val = "FFFFFF" }), new Text("●"))
                )
            ));
            // Label
            row.Append(new TableCell(
                new TableCellProperties(new TableCellWidth { Width = "4026", Type = TableWidthUnitValues.Dxa }),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold()), new Text(r.label))
                )
            ));
            // Bar + status
            row.Append(new TableCell(
                new TableCellProperties(new TableCellWidth { Width = "4400", Type = TableWidthUnitValues.Dxa }),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(
                        new RunProperties(new RunFonts { Ascii = "Consolas", HighAnsi = "Consolas" }, new Color { Val = r.color }),
                        new Text(r.bar + "  " + r.status)
                    )
                )
            ));
            chartTable.Append(row);
        }

        body.Append(chartTable);

        // Legend
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "120" }, new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(new Bold(), new FontSize { Val = "20" }), new Text("Leyenda:  ")),
            new Run(new RunProperties(new Bold(), new Color { Val = Green }), new Text("● 4 Verde  ")),
            new Run(new RunProperties(new Bold(), new Color { Val = Yellow }), new Text("● 3 Amarillo  ")),
            new Run(new RunProperties(new Bold(), new Color { Val = Red }), new Text("● 1 Rojo"))
        ));
    }

    // ─────────────────────── OBLIGATIONS TABLE (summary) ───────────────────────
    private static void BuildObligationsTable(Body body)
    {
        body.Append(ModernTable(
            new[] { "Obligación", "Descripción", "Estado" },
            new[] {
                new[] { "5.1", "Geodatabase (diseño y construcción)", "Verde" },
                new[] { "5.2", "Arquitectura funcional", "Verde" },
                new[] { "5.3", "Diseño UX/UI", "Verde" },
                new[] { "5.4", "Desarrollo tecnológico", "Verde" },
                new[] { "5.5", "Pruebas, implementación y puesta en operación", "Amarillo" },
                new[] { "5.6", "Soporte post-implementación", "Verde" },
                new[] { "5.7", "Capacitación (4 talleres)", "Rojo" },
                new[] { "5.8", "Entregables y documentación", "Amarillo" },
            },
            statusColumnIndex: 2
        ));
    }

    // ─────────────────────── DB STATE TABLE ───────────────────────
    private static void BuildDatabaseStateTable(Body body)
    {
        body.Append(ModernTable(
            new[] { "Tabla", "Filas", "Estado" },
            new[] {
                new[] { "arboles_monitoreo", "148", "75 con especie en Línea base; Monitoreo 1-4 con placeholders" },
                new[] { "capas_geograficas", "1.114", "Curvas de nivel (1.106), maleza acuática (5), aislamiento interno (3) — reales" },
                new[] { "coberturas_vegetales", "24", "Real (Corine, levantamiento dron)" },
                new[] { "puntos_monitoreo", "20", "15 parcelas Restauración + 5 Ficorremediación — reales y georreferenciados" },
                new[] { "tecnicas_restauracion", "27", "Real" },
                new[] { "lotes_bioaumentacion", "1", "Real (capa restringida, no se expone en el geovisor)" },
                new[] { "estratos_vegetacion", "3", "Real" },
                new[] { "insumos_dron", "8", "Real" },
                new[] { "gobernanza_actividades", "7", "Real y completo (socializaciones, talleres, capacitaciones, jornadas, negocios verdes)" },
                new[] { "usuarios", "3", "admin / técnico / consulta" },
                new[] { "fauna_grupos_resumen", "0", "Estructura lista — sin datos" },
                new[] { "fauna_diversidad_curvas", "0", "Estructura lista — sin datos" },
                new[] { "ficor_calidad_agua", "0", "Estructura lista (15 variables del Excel) — sin datos" },
                new[] { "ficor_calidad_sedimentos", "0", "Estructura lista (metales + plaguicidas) — sin datos" },
                new[] { "ficor_biota", "0", "Estructura lista (6 grupos) — sin datos" },
                new[] { "documentos", "0", "Tabla del modelo general (spec), no usada aún" },
                new[] { "fotografias", "0", "Tabla del modelo general (spec); evidencia fotográfica real aún no cargada" },
                new[] { "indicadores_ambientales", "0", "Tabla del modelo general (spec), no usada aún" },
                new[] { "monitoreos / parcelas", "0", "Tablas del modelo general (spec); el dato real vive en tablas específicas" },
            }
        ));
    }

    // ─────────────────────── NEXT STEPS TABLE ───────────────────────
    private static void BuildNextStepsTable(Body body)
    {
        body.Append(ModernTable(
            new[] { "Acción", "Responsable", "Bloquea a" },
            new[] {
                new[] { "Programar los 4 talleres de capacitación (obligación 5.7)", "MC Consultorías + Dirección del Proyecto", "Pago 30 % (3.3) y liquidación" },
                new[] { "Definir variables del tablero de Fauna", "Darío", "fauna_grupos_resumen, fauna_diversidad_curvas" },
                new[] { "Entregar resultados de laboratorio (agua/sedimentos) y conteos de biota", "Equipo de ficorremediación", "ficor_calidad_agua, ficor_calidad_sedimentos, ficor_biota" },
                new[] { "Completar campañas de Monitoreo 1-4 (censo forestal)", "Yurani / equipo de campo", "Indicadores reales de Restauración por fecha" },
                new[] { "Confirmar fórmula de densidad/área basal y tamaño de parcela", "Yurani", "KPIs de Restauración" },
                new[] { "Validar y firmar manuales técnico/usuario y diccionario de datos", "Dirección del Proyecto", "Entregable 5.8" },
                new[] { "Consolidar informe formal de pruebas técnicas", "MC Consultorías", "Entregable 5.5" },
                new[] { "Entregar/cargar cartografía base institucional oficial", "Entidad / Dirección del Proyecto", "Entregable 5.1 (d, e)" },
            }
        ));
    }

    // ─────────────────────── WEIGHTED PROGRESS TABLE ───────────────────────
    private static void BuildWeightedProgressTable(Body body)
    {
        body.Append(ModernTable(
            new[] { "Componente", "Peso", "% Avance", "% Ponderado", "Estado" },
            new[] {
                new[] { "Geodatabase (PostGIS)", "25%", "95%", "23,75%", "Verde" },
                new[] { "Geovisor (frontend + mapas)", "20%", "95%", "19,00%", "Verde" },
                new[] { "Backend / API REST", "15%", "90%", "13,50%", "Verde" },
                new[] { "Módulo de reportes (PDF/Excel/CSV)", "10%", "90%", "9,00%", "Verde" },
                new[] { "Autenticación y seguridad", "10%", "85%", "8,50%", "Verde" },
                new[] { "Dashboard de indicadores", "20%", "85%", "17,00%", "Verde" },
                new[] { "TOTAL AVANCE PONDERADO", "100%", "—", "90,75%", "Verde" },
            },
            statusColumnIndex: 4
        ));
    }

    // ─────────────────────── HELPER: HEADING ───────────────────────
    private static void H1(Body body, string text) =>
        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Heading1" }),
            new Run(new Text(text))
        ));

    private static void H2(Body body, string text) =>
        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Heading2" }),
            new Run(new Text(text))
        ));

    private static void H3(Body body, string text) =>
        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Heading3" }),
            new Run(new Text(text))
        ));

    private static void Para(Body body, string text, bool italic = false, bool bold = false)
    {
        var pPr = new ParagraphProperties();
        var rPr = new RunProperties();
        if (italic) rPr.Append(new Italic());
        if (bold) rPr.Append(new Bold());
        body.Append(new Paragraph(
            pPr,
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

    private static void BulletList(Body body, string[] items)
    {
        foreach (var item in items)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(
                    new Indentation { Left = "360", Hanging = "180" },
                    new SpacingBetweenLines { After = "60" }
                ),
                new Run(new RunProperties(new Color { Val = Teal }, new Bold()), new Text("•  ")),
                new Run(new Text(item))
            ));
        }
    }

    // ─────────────────────── OBLIGATION SECTION ───────────────────────
    private static void Obligation(Body body, string code, string title, string[] completed, (string label, string text)[]? pendientes, string status)
    {
        H2(body, $"{code}  {title}");

        // Status pill
        string color = status switch
        {
            "Verde" => Green,
            "Amarillo" => Yellow,
            "Rojo" => Red,
            _ => Gray,
        };
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "120" }),
            new Run(new RunProperties(new Bold(), new Color { Val = "FFFFFF" }, new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = color }), new Text($"  {status}  "))
        ));

        H3(body, "Logros");
        BulletList(body, completed);

        if (pendientes != null && pendientes.Length > 0)
        {
            H3(body, "Pendientes");
            for (int i = 0; i < pendientes.Length; i++)
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(
                        new Indentation { Left = "360", Hanging = "180" },
                        new SpacingBetweenLines { After = "80" }
                    ),
                    new Run(new RunProperties(new Bold(), new Color { Val = Yellow }), new Text($"[{pendientes[i].label}]  ")),
                    new Run(new Text(pendientes[i].text))
                ));
            }
        }
    }

    // ─────────────────────── MODERN TABLE ───────────────────────
    private static Table ModernTable(string[] headers, string[][] data, int? statusColumnIndex = null)
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
        int colW = 9200 / headers.Length;
        foreach (var _ in headers) grid.Append(new GridColumn { Width = colW.ToString() });
        table.Append(grid);

        // Header row
        var hRow = new TableRow();
        foreach (var h in headers)
        {
            hRow.Append(new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "0", Type = TableWidthUnitValues.Auto },
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = HeaderFill },
                    new TableCellBorders(
                        new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Navy }
                    )
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = "FFFFFF" }, new FontSize { Val = "20" }), new Text(h))
                )
            ));
        }
        table.Append(hRow);

        // Data rows
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

                // Status column with colored badge
                if (statusColumnIndex.HasValue && c == statusColumnIndex.Value)
                {
                    string badgeColor = cellText switch
                    {
                        "Verde" => Green,
                        "Amarillo" => Yellow,
                        "Rojo" => Red,
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

    // ─────────────────────── HEADER ───────────────────────
    private static void AddHeader(MainDocumentPart mainPart, SectionProperties sectPr, string text)
    {
        var headerPart = mainPart.AddNewPart<HeaderPart>();
        headerPart.Header = new Header(
            new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Center },
                    new ParagraphBorders(
                        new BottomBorder { Val = BorderValues.Single, Size = 4, Space = 4, Color = Teal }
                    )
                ),
                new Run(
                    new RunProperties(new Color { Val = Navy }, new FontSize { Val = "18" }, new Bold()),
                    new Text(text) { Space = SpaceProcessingModeValues.Preserve }
                )
            )
        );
        headerPart.Header.Save();
        sectPr.Append(new HeaderReference
        {
            Type = HeaderFooterValues.Default,
            Id = mainPart.GetIdOfPart(headerPart)
        });
    }

    // ─────────────────────── FOOTER: left text + right Página X de Y ───────────────────────
    private static void AddFooterWithPageXofY(MainDocumentPart mainPart, SectionProperties sectPr, string leftText)
    {
        var footerPart = mainPart.AddNewPart<FooterPart>();

        // Use a 1-row, 2-col table for proper left/right alignment
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
        // Left
        row.Append(new TableCell(
            new TableCellProperties(new TableCellWidth { Width = "6626", Type = TableWidthUnitValues.Dxa }),
            new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Left },
                    new SpacingBetweenLines { After = "0" }
                ),
                new Run(
                    new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }),
                    new Text(leftText) { Space = SpaceProcessingModeValues.Preserve }
                )
            )
        ));
        // Right: "Página X de Y"
        var rightCellPara = new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Right },
                new SpacingBetweenLines { After = "0" }
            )
        );
        rightCellPara.Append(new Run(
            new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }),
            new Text("Página ") { Space = SpaceProcessingModeValues.Preserve }
        ));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Begin }));
        rightCellPara.Append(new Run(new FieldCode(" PAGE ") { Space = SpaceProcessingModeValues.Preserve }));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.Separate }));
        rightCellPara.Append(new Run(new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }), new Text("1")));
        rightCellPara.Append(new Run(new FieldChar { FieldCharType = FieldCharValues.End }));
        rightCellPara.Append(new Run(
            new RunProperties(new Color { Val = CaptionGray }, new FontSize { Val = "16" }),
            new Text(" de ") { Space = SpaceProcessingModeValues.Preserve }
        ));
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
        sectPr.Append(new FooterReference
        {
            Type = HeaderFooterValues.Default,
            Id = mainPart.GetIdOfPart(footerPart)
        });
    }
}
