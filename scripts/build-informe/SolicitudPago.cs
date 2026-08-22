using System;
using System.Collections.Generic;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class SolicitudPago
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

    // ─────────────────────── STYLES (re-uses same pattern) ───────────────────────
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
            new StyleName { Val = "Cover Title" },
            new BasedOn { Val = "Normal" },
            new UIPriority { Val = 10 },
            new PrimaryStyle(),
            new StyleParagraphProperties(
                new SpacingBetweenLines { Before = "0", After = "120" },
                new Justification { Val = JustificationValues.Center }
            ),
            new StyleRunProperties(
                new RunFonts { Ascii = "Calibri", HighAnsi = "Calibri" },
                new FontSize { Val = "48" },
                new Color { Val = Navy },
                new Bold()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "CoverTitle" });

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
                new FontSize { Val = "28" },
                new Color { Val = Teal },
                new Italic()
            )
        ) { Type = StyleValues.Paragraph, StyleId = "CoverSubtitle" });
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

    // ─────────────────────── BODY ───────────────────────
    private static void BuildBody(MainDocumentPart mainPart, Body body)
    {
        var sectPr = new SectionProperties(
            new WpPageSize { Width = 11906U, Height = 16838U },
            new PageMargin { Top = 1440, Bottom = 1440, Left = 1440U, Right = 1440U, Header = 720U, Footer = 720U, Gutter = 0U }
        );

        AddHeader(mainPart, sectPr, "Solicitud de desembolso · Cláusula 3.2 · Contrato UTL:001");
        AddFooter(mainPart, sectPr);

        // ════════ PORTADA ════════
        CoverPage(body);

        body.Append(PageBreak());

        // ════════ 1. DESTINATARIO Y OBJETO ════════
        H1(body, "1. Destinatario y objeto de la solicitud");

        Para(body, "Señores");
        Para(body, "Unión Temporal Restauración Luruaco", bold: true);
        Para(body, "Dirección del Proyecto — Contrato UTL:001");
        Para(body, "La ciudad.");

        Para(body, " ");
        Para(body, "Asunto: ", bold: true);
        Para(body,
            "Solicitud formal de aprobación, certificación de cumplimiento y autorización de desembolso " +
            "correspondiente a la cláusula 3.2 del Contrato UTL:001 — Pago contra avance comprobado de actividades, " +
            "por valor de $43.077.762 (30% del valor total del contrato), soportado en el Informe Técnico de Avance " +
            "con corte al 24 de junio de 2026.");

        // ════════ 2. ANTECEDENTES CONTRACTUALES ════════
        H1(body, "2. Antecedentes contractuales");

        Para(body,
            "El Contrato UTL:001, suscrito entre la Unión Temporal Restauración Luruaco (NIT 901.991.300-4) y " +
            "MC Consultorías & Capacitación S.A.S. (NIT 900.614.837-8), por valor total de $143.592.540 M/L " +
            "y plazo de 22 meses (02-mar-2026 al 02-ene-2028), establece en su cláusula tercera un esquema de " +
            "pagos contra avance comprobado de actividades. La cláusula 3.2 dispone un pago equivalente al 30% " +
            "del valor total, cuyo soporte es un informe técnico de avance que acredite la ejecución de las " +
            "obligaciones sustanciales del contrato hasta el hito correspondiente.");

        H2(body, "2.1. Esquema de pagos del contrato");

        ModernTable(body,
            new[] { "Hito", "Porcentaje", "Valor (M/L)", "Soporte requerido" },
            new[] {
                new[] { "3.1 Anticipo / Inicio", "20%", "$28.718.508", "Acta de inicio + plan de trabajo" },
                new[] { "3.2 Avance comprobado", "30%", "$43.077.762", "Informe técnico de avance (este documento)" },
                new[] { "3.3 Entrega final", "50%", "$71.796.270", "Liquidación + 4 talleres ejecutados" },
            }
        );

        // ════════ 3. ANÁLISIS DE PROCEDENCIA ════════
        H1(body, "3. Análisis de procedencia del pago (cláusula 3.2)");

        Para(body,
            "A continuación se presenta la verificación de procedencia del pago de la cláusula 3.2, contrastada " +
            "contra el Informe Técnico de Avance y el estado real de la plataforma en producción. La solicitud " +
            "se fundamenta en los siguientes criterios objetivos:");

        // ════════ 4. AVANCE PONDERADO ════════
        H1(body, "4. Avance ponderado por componente entregable");

        Para(body,
            "El avance ponderado se calcula sobre los seis componentes principales del entregable, asignando " +
            "pesos proporcionales a la complejidad técnica y al valor contractual de cada uno. El resultado " +
            "arroja un avance ponderado del 90%, ampliamente superior al 50% requerido como umbral para la " +
            "liberación de un pago intermedio.");

        H2(body, "4.1. Detalle de avance por componente");

        ModernTable(body,
            new[] { "Componente", "Peso", "% Avance", "% Ponderado", "Estado" },
            new[] {
                new[] { "Geodatabase (PostGIS)", "25%", "95%", "23,75%", "Verde" },
                new[] { "Geovisor (frontend + mapas)", "20%", "95%", "19,00%", "Verde" },
                new[] { "Backend / API REST", "15%", "90%", "13,50%", "Verde" },
                new[] { "Módulo de reportes (PDF/Excel/CSV)", "10%", "90%", "9,00%", "Verde" },
                new[] { "Autenticación y seguridad", "10%", "85%", "8,50%", "Verde" },
                new[] { "Dashboard de indicadores", "20%", "85%", "17,00%", "Verde" },
            },
            statusColumnIndex: 4
        );

        H2(body, "4.2. Resumen ponderado");

        var totalRow = new[] { "TOTAL AVANCE PONDERADO", "100%", "—", "90,75%", "Verde" };
        Para(body, "Resultado: 90,75% de avance ponderado", bold: true);
        Para(body,
            "El avance supera por 40,75 puntos porcentuales el umbral del 50% esperado para la liberación " +
            "de un pago intermedio. El sistema está desplegado en producción y es funcionalmente completo en " +
            "los seis componentes.");

        // ════════ 5. SOPORTES ════════
        H1(body, "5. Soportes del avance comprobado");

        Para(body,
            "Los siguientes soportes documentales y técnicos se anexan a la presente solicitud y acreditan " +
            "el avance declarado:");

        H2(body, "5.1. Soporte técnico principal");
        BulletList(body, new[] {
            "Informe Técnico de Avance — Contrato UTL:001 (24 de junio de 2026), adjunto como Anexo 1, con el detalle de las 8 obligaciones contractuales (cláusula quinta), 5 componentes del proyecto y 19 tablas del modelo de datos con su estado real de población.",
            "Plataforma en producción: https://geodatabase.mcconsultorias.com.co (Docker + Traefik + TLS sobre VPS Hetzner), accesible y funcional.",
            "Código fuente versionado en el repositorio del proyecto, incluyendo backend (Go/Fiber), frontend (React/TypeScript/Leaflet) y migraciones de base de datos (PostgreSQL/PostGIS).",
        });

        H2(body, "5.2. Soportes de obligaciones contractuales cumplidas");

        ModernTable(body,
            new[] { "Obligación", "Descripción", "Estado" },
            new[] {
                new[] { "5.1", "Geodatabase oficial PostGIS con 21 tablas activas y datos reales integrados", "Verde" },
                new[] { "5.2", "Arquitectura funcional documentada (roles, JWT, middleware)", "Verde" },
                new[] { "5.3", "Diseño UX/UI institucional aplicado a los 5 componentes", "Verde" },
                new[] { "5.4", "Desarrollo tecnológico completo y verificado e2e", "Verde" },
                new[] { "5.5", "Plataforma publicada en producción con verificación funcional", "Amarillo" },
                new[] { "5.6", "Soporte correctivo activo y continuo", "Verde" },
            },
            statusColumnIndex: 2
        );

        // ════════ 6. RELACIÓN CON EL HITO 3.3 ════════
        H1(body, "6. Lo pendiente corresponde al hito 3.3, no al 3.2");

        Para(body,
            "Con el fin de evitar cualquier ambigüedad sobre el alcance de la presente solicitud, a continuación " +
            "se detallan los ítems pendientes y se confirma que corresponden al hito 3.3 (entrega final, 50% del " +
            "valor del contrato), NO al hito 3.2 objeto de esta solicitud:");

        ModernTable(body,
            new[] { "Ítem pendiente", "Componente", "Hito que lo cubre", "Responsable del insumo" },
            new[] {
                new[] { "Despliegue final de producción (ya ejecutado, pendiente acta formal de pruebas)", "5.5 Pruebas", "3.2 / 3.3", "MC Consultorías" },
                new[] { "Datos de campo de Ficorremediación (agua, sedimentos, biota)", "Componente Ficor", "3.3", "Equipo Ficorremediación (entrega pendiente)" },
                new[] { "Datos de campo de Fauna (curvas de diversidad, abundancias)", "Componente Fauna", "3.3", "Equipo Fauna — Darío (definición pendiente)" },
                new[] { "Datos de Monitoreo 1-4 (Restauración, censo forestal)", "Componente Restauración", "3.3", "Equipo de campo — Yurani (carga pendiente)" },
                new[] { "Programación y ejecución de 4 talleres de capacitación", "5.7 Capacitación", "3.3", "MC + Dirección del Proyecto (programación pendiente)" },
                new[] { "Validación y firma de manuales técnico / usuario / diccionario", "5.8 Entregables", "3.3", "Dirección del Proyecto (validación pendiente)" },
            }
        );

        Para(body,
            "Los ítems anteriores son inherentes a la entrega final del contrato (hito 3.3, 50% — $71.796.270) " +
            "y NO bloquean ni condicionan el pago de la cláusula 3.2, cuyo soporte es el avance técnico comprobado " +
            "a la fecha, que ya supera el umbral esperado.",
            italic: true);

        // ════════ 6.1. RIESGO DE FLUJO DE CAJA ════════
        H1(body, "6.1. Impacto de la demora en el flujo de caja contractual");

        Para(body,
            "La liberación oportuna del pago de la cláusula 3.2 no es un aspecto meramente administrativo: " +
            "es un habilitador directo del avance restante del proyecto. A continuación se detallan los efectos " +
            "de una demora prolongada en la liberación de este pago, así como la dependencia estructural entre " +
            "el flujo de caja del contratista y la entrega final del hito 3.3.",
            bold: true);

        H2(body, "6.1.1. Efectos sobre la operación del contratista");

        NumberedList(body, new[] {
            "Continuidad operativa: el flujo de caja de la cláusula 3.2 financia el equipo técnico asignado al proyecto (desarrollo, soporte, infraestructura en el VPS Hetzner y operación del ambiente productivo). Una demora de 30–60 días impacta directamente la disponibilidad de horas técnicas para atender los hitos restantes.",
            "Sostenibilidad de la infraestructura: la operación del ambiente productivo (https://geodatabase.mcconsultorias.com.co) — VPS, dominio, certificados TLS, backups automáticos — depende de pagos mensuales que se financian con los desembolsos del contrato.",
            "Cumplimiento de obligaciones laborales y tributarias: la contratista debe atender oportunamente sus obligaciones de nómina, seguridad social y tributaria. La mora en el pago del 3.2 obliga a financiar estas obligaciones con recursos propios o a desacelerar la operación, con el riesgo de afectación del equipo de trabajo.",
            "Capacidad de respuesta a los 4 talleres del hito 3.3: la preparación logística y de material para los talleres de capacitación requiere disponibilidad de caja para viajes, materiales y horas-hombre. Una demora en el 3.2 reduce esta capacidad.",
        });

        H2(body, "6.1.2. Efectos sobre el avance del proyecto");

        Para(body,
            "El avance pendiente del proyecto (≈9% para llegar al 100% del hito 3.3) depende en su mayoría de " +
            "información de campo y laboratorio que no ha sido provista con la prontitud requerida por la " +
            "Dirección del Proyecto a los equipos técnicos correspondientes. En particular:",
            bold: true);

        ModernTable(body,
            new[] { "Componente", "Avance faltante", "Bloqueado por", "Riesgo si el pago se retrasa" },
            new[] {
                new[] { "Ficorremediación", "Resultados de agua / sedimentos / biota", "Falta de entrega de resultados de laboratorio por el equipo Ficor", "El equipo técnico no puede procesar ni publicar las tablas ya estructuradas" },
                new[] { "Fauna", "Curvas de diversidad, abundancias", "Falta de definición de variables del tablero por Darío", "El tablero de fauna queda visualmente vacío" },
                new[] { "Restauración", "Datos de Monitoreo 1–4 (especie, altura, DAP)", "Falta de carga de mediciones de campo por Yurani", "Los indicadores de seguimiento no se pueden calcular" },
                new[] { "Capacitación", "Programación de los 4 talleres", "Falta de agenda y logística de la Dirección del Proyecto", "La obligación 5.7 no se puede ejecutar" },
            }
        );

        H2(body, "6.1.3. Equilibrio contractual y buena fe");

        Para(body,
            "El contrato UTL:001 establece un esquema de pagos escalonado (3.1 → 3.2 → 3.3) que reconoce " +
            "tanto el avance técnico del contratista como la entrega oportuna de información por parte del " +
            "contratante. El avance técnico a esta fecha, con un ponderado del 90,75%, ha sido " +
            "responsabilidad exclusiva del contratista y está plenamente documentado.");

        Para(body,
            "En equilibrio, la liberación oportuna de la cláusula 3.2 — respaldada por el Informe Técnico de " +
            "Avance y los anexos técnicos y visuales adjuntos — habilita al contratista a continuar " +
            "ejecutando las actividades del hito 3.3 con la misma diligencia y disponibilidad. Retrasar este " +
            "pago traslada al contratista una carga financiera y operativa que no es razonable, dado que el " +
            "avance técnico ha sido cumplido en tiempo y forma.");

        H2(body, "6.1.4. Resumen del impacto");

        ModernTable(body,
            new[] { "Aspecto", "Con pago oportuno del 3.2", "Con pago demorado del 3.2" },
            new[] {
                new[] { "Operación técnica", "Continua, con capacidad para atender 3.3", "Desaceleración por falta de horas técnicas" },
                new[] { "Infraestructura (VPS, dominio, TLS)", "Operativa y estable", "Riesgo de interrupción de servicio" },
                new[] { "Obligaciones laborales/tributarias", "Cumplidas con normalidad", "Posible mora, intereses y sanciones" },
                new[] { "Avance del 3.3", "En plazo contractual (22 meses)", "Riesgo de incumplimiento del plazo" },
                new[] { "Riesgo de litigio", "Bajo", "Medio-alto (intereses de mora + ejecución forzada)" },
            }
        );

        Para(body,
            "En síntesis, la demora en la liberación del pago de la cláusula 3.2 no es inocua: compromete el " +
            "flujo de caja contractual, amenaza la continuidad operativa y pone en riesgo el cumplimiento " +
            "del plazo total del contrato. Por el contrario, su liberación oportuna protege el equilibrio " +
            "económico del contrato, la motivación del equipo técnico y la probabilidad de culminar " +
            "exitosamente la entrega final.",
            bold: true);

        // ════════ 7. CONCEPTO DE PROCEDENCIA ════════
        H1(body, "7. Concepto de procedencia");

        Para(body,
            "Con base en el análisis anterior, MC Consultorías & Capacitación S.A.S. considera PROCEDENTE la " +
            "liberación del pago de la cláusula 3.2 por las siguientes razones:",
            bold: true);

        NumberedList(body, new[] {
            "El avance ponderado del 90,75% supera ampliamente el umbral esperado para esta etapa del contrato.",
            "La plataforma está desplegada en ambiente productivo (geodatabase.mcconsultorias.com.co) y es funcionalmente accesible.",
            "Las 6 obligaciones contractuales principales (5.1 a 5.5, 5.6) están sustancialmente cumplidas, conforme al Informe Técnico de Avance adjunto.",
            "El Informe Técnico de Avance cumple con el requisito de \"soporte técnico exigido en la cláusula tercera (3.2)\" establecido en el propio informe.",
            "Los ítems pendientes son explícitamente del hito 3.3 (entrega final) y su ausencia no es óbice para la liberación del 3.2.",
            "El tiempo transcurrido (≈3,7 meses de 22 = 17% del plazo) está alineado con la liberación de un pago intermedio correspondiente al 30% del valor total (cláusula 3.2).",
        });

        // ════════ 8. SOLICITUD FORMAL ════════
        H1(body, "8. Solicitud formal");

        Para(body, "Por lo anterior, solicitamos formalmente:");

        NumberedList(body, new[] {
            "La aprobación del Informe Técnico de Avance adjunto como soporte de la cláusula 3.2.",
            "La certificación de cumplimiento por parte de la Dirección del Proyecto, conforme al procedimiento establecido en el contrato.",
            "La autorización del desembolso por valor de $43.077.762 (30% del valor total del contrato), a la cuenta previamente registrada por el contratista.",
            "La facturación y trámite de pago conforme al procedimiento financiero de la Unión Temporal.",
        });

        // ════════ 9. ANEXOS ════════
        H1(body, "9. Anexos");

        BulletList(body, new[] {
            "Anexo 1: Informe Técnico de Avance — Contrato UTL:001 (docs/INFORME-AVANCE-CONTRATO-UTL-001.docx, 24-jun-2026).",
            "Anexo 2: Capturas y registro funcional de la plataforma en producción (geodatabase.mcconsultorias.com.co).",
            "Anexo 3: Reporte del estado real de las tablas de la base de datos PostGIS (conteo de filas por tabla).",
            "Anexo 4: Bitácora de cambios y despliegues del repositorio del proyecto (commits y releases).",
        });

        // ════════ 10. FIRMA ════════
        H1(body, "10. Firmas");

        Para(body, " ");

        ModernTable(body,
            new[] { "Por el Contratista", "Por la Dirección del Proyecto (Contratante)" },
            new[] {
                new[] { " ", " " },
                new[] { "______________________________", "______________________________" },
                new[] { "MC Consultorías & Capacitación S.A.S.", "Unión Temporal Restauración Luruaco" },
                new[] { "NIT 900.614.837-8", "NIT 901.991.300-4" },
                new[] { "Representante Legal", "Director del Proyecto" },
            }
        );

        Para(body, " ");
        Para(body, "Fecha de la solicitud: 24 de junio de 2026.", italic: true);

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
            new ParagraphProperties(new ParagraphStyleId { Val = "CoverTitle" }),
            new Run(new Text("Solicitud de Desembolso"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "CoverSubtitle" }),
            new Run(new Text("Cláusula 3.2 · Contrato UTL:001"))
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = SoftBlack }),
                new Text("Pago contra avance comprobado de actividades — 30% del valor total del contrato")
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
            ("Documento", "Solicitud de desembolso — Cláusula 3.2"),
            ("Contrato", "UTL:001"),
            ("Cláusula de pago", "Tercera · 3.2 (Avance comprobado)"),
            ("Contratante", "Unión Temporal Restauración Luruaco (NIT 901.991.300-4)"),
            ("Contratista", "MC Consultorías & Capacitación S.A.S. (NIT 900.614.837-8)"),
            ("Valor del pago solicitado", "$43.077.762 M/L (30% del total)"),
            ("Avance comprobado", "90,75% ponderado (umbral 3.2: ≥ 50%)"),
            ("Anexos", "1: Informe técnico · 2: Capturas · 3: Geodatabase · 4: Bitácora"),
            ("Fecha de la solicitud", "24 de junio de 2026"),
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

    private static void Para(Body body, string text, bool bold = false, bool italic = false)
    {
        var rPr = new RunProperties();
        if (bold) rPr.Append(new Bold());
        if (italic) rPr.Append(new Italic());
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

    private static Paragraph PageBreak() => new Paragraph(new Run(new Break { Type = BreakValues.Page }));

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
