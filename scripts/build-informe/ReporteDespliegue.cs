using System;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class ReporteDespliegue
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

        AddHeader(mainPart, sectPr, "Reporte de despliegue · Verificación de la plataforma en producción");
        AddFooter(mainPart, sectPr);

        CoverPage(body);
        body.Append(PageBreak());

        // ════════ 1. RESUMEN EJECUTIVO ════════
        H1(body, "1. Resumen ejecutivo del estado del despliegue");

        Para(body,
            "El presente reporte documenta el estado actual del despliegue de la plataforma Geodatabase Luruaco, " +
            "con corte a la fecha de verificación del 25 de junio de 2026. La verificación consistió en pruebas " +
            "de conectividad contra la URL documentada como productiva y contra la IP del VPS de respaldo.");

        H2(body, "1.1. Conclusión principal");

        var conclusion = new Table();
        conclusion.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Red },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Red },
                new LeftBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new RightBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideHorizontalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "200", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "240", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "200", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "240", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "9026" });
        conclusion.Append(grid);
        conclusion.Append(new TableRow(
            new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "9026", Type = TableWidthUnitValues.Dxa },
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = "FEE2E2" }
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "120" }),
                    new Run(new RunProperties(new Bold(), new FontSize { Val = "24" }, new Color { Val = Red }), new Text("ESTADO: NO OPERATIVO (verificación 25-jun-2026)"))
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new Text("La plataforma ")),
                    new Run(new RunProperties(new Bold()), new Text("geodatabase.mcconsultorias.com.co")),
                    new Run(new Text(" ")),
                    new Run(new Text("no responde a conexiones HTTPS (puerto 443), HTTP (puerto 80) ni al puerto directo del backend (8080). El dominio DNS resuelve correctamente a la IP 2.24.97.152, pero la máquina no acepta conexiones TCP entrantes. La IP de respaldo documentada (187.77.4.10) también está inalcanzable en el puerto 8080. El servidor de ping responde (145–383 ms), lo que descarta una caída total del host y apunta a un bloqueo a nivel de firewall, contenedor detenido, o servicio caído."))
                )
            )
        ));
        body.Append(conclusion);

        body.Append(PageBreak());

        // ════════ 2. PRUEBAS REALIZADAS ════════
        H1(body, "2. Pruebas de conectividad realizadas");

        H2(body, "2.1. Resumen de pruebas");
        ModernTable(body,
            new[] { "#", "Prueba", "Endpoint / Host", "Resultado", "Latencia / Detalle" },
            new[] {
                new[] { "1", "Resolución DNS", "geodatabase.mcconsultorias.com.co", "OK", "Resuelve a 2.24.97.152" },
                new[] { "2", "HTTPS al dominio", "https://geodatabase.mcconsultorias.com.co/health", "FALLO", "Connection timed out (10 s)" },
                new[] { "3", "HTTPS a la raíz", "https://geodatabase.mcconsultorias.com.co/", "FALLO", "Connection timed out (10 s)" },
                new[] { "4", "HTTPS directo a IP", "https://2.24.97.152/health", "FALLO", "Connection timed out (8 s)" },
                new[] { "5", "HTTP al puerto 80", "http://2.24.97.152/", "FALLO", "Connection timed out (8 s)" },
                new[] { "6", "HTTP al puerto 8080", "http://2.24.97.152:8080/health", "FALLO", "Connection timed out (8 s)" },
                new[] { "7", "HTTP a IP de respaldo", "http://187.77.4.10:8080/health", "FALLO", "Connection timed out (8 s)" },
                new[] { "8", "Ping al host", "ping 2.24.97.152", "OK", "145–383 ms (2/2 paquetes, 0% packet loss)" },
            }
        );

        H2(body, "2.2. Diagnóstico técnico");
        Para(body,
            "El patrón de comportamiento observado es consistente con una de las siguientes causas (en orden " +
            "de probabilidad):");

        NumberedList(body, new[] {
            "El contenedor del frontend/backend (Traefik o el servicio Go) está detenido y el firewall del VPS bloquea todos los puertos entrantes excepto ICMP.",
            "El VPS fue suspendido por el proveedor (Hetzner) por falta de pago o por uso indebido de recursos.",
            "El firewall de Hetzner o un security group está bloqueando los puertos 80/443/8080 desde Internet.",
            "La migración del VPS documentada en 10-INFRAESTRUCTURA-PRODUCCION.md (de 187.77.4.10 a una IP nueva) no se completó y la nueva IP no expone los servicios.",
            "Cambio de proveedor / migración de infraestructura no documentada en el repositorio.",
        });

        H2(body, "2.3. Comando exacto ejecutado");
        Para(body, "curl -sS -o /dev/null -w \"HTTP %{http_code} · %{time_total}s\\n\" --max-time 10 https://geodatabase.mcconsultorias.com.co/health", italic: true);

        body.Append(PageBreak());

        // ════════ 3. ESTADO DOCUMENTADO VS REAL ════════
        H1(body, "3. Estado documentado en el repositorio vs. estado real verificado");

        ModernTable(body,
            new[] { "Aspecto", "Documentado en el repositorio", "Real verificado el 25-jun-2026" },
            new[] {
                new[] { "URL de producción", "https://geodatabase.mcconsultorias.com.co", "No responde (timeout 10 s)" },
                new[] { "VPS de respaldo", "187.77.4.10 (srv1334142) — Ubuntu 22.04", "No responde en puerto 8080" },
                new[] { "Backend Go (Fiber)", "Puerto 8080, health check /health", "Inalcanzable" },
                new[] { "Frontend (nginx)", "Puerto 8081 / 443 detrás de Traefik", "Inalcanzable" },
                new[] { "PostgreSQL + PostGIS", "Puerto 5432 (interno, no público)", "No verificable desde fuera" },
                new[] { "TLS", "Let's Encrypt (renovación automática)", "No verificable (no hay conexión)" },
                new[] { "Estado declarado en el Informe Técnico", "🟢 Plataforma en producción, geodatabase.mcconsultorias.com.co accesible y funcional", "🔴 No responde" },
            }
        );

        H2(body, "3.1. Discrepancia con el Informe Técnico de Avance (24-jun-2026)");

        var disc = new Table();
        disc.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = Yellow },
                new BottomBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = Yellow },
                new LeftBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new RightBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = "FEF3C7" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "120", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "180", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "120", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "180", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var discGrid = new TableGrid();
        discGrid.Append(new GridColumn { Width = "9026" });
        disc.Append(discGrid);
        disc.Append(new TableRow(
            new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "9026", Type = TableWidthUnitValues.Dxa },
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = "FEF3C7" }
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "120" }),
                    new Run(new RunProperties(new Bold(), new FontSize { Val = "24" }, new Color { Val = "92400E" }), new Text("⚠ Advertencia: discrepancia entre lo declarado y lo verificado"))
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    new Run(new Text("El Anexo 1 (Informe Técnico de Avance) y la Solicitud de Desembolso de la cláusula 3.2 declaran que la plataforma ")),
                    new Run(new RunProperties(new Bold()), new Text("geodatabase.mcconsultorias.com.co")),
                    new Run(new Text(" está publicada y operativa. La verificación independiente del 25-jun-2026 no pudo confirmar esa afirmación: la URL y los puertos asociados no responden a conexiones HTTPS ni HTTP."))
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new Text("Esta discrepancia debe ser resuelta ")),
                    new Run(new RunProperties(new Bold()), new Text("antes de proceder con la facturación de la cláusula 3.2")),
                    new Run(new Text(", para evitar pagos contra un avance que no es demostrable de forma independiente por la Dirección del Proyecto."))
                )
            )
        ));
        body.Append(disc);

        body.Append(PageBreak());

        // ════════ 4. ACCIONES REQUERIDAS ════════
        H1(body, "4. Acciones requeridas para restablecer la disponibilidad");

        H2(body, "4.1. Acciones inmediatas (próximas 24 horas)");

        NumberedList(body, new[] {
            "Verificar el estado del VPS en el panel de Hetzner: activo/suspendido/eliminado.",
            "Si el VPS está activo, iniciar sesión por SSH y verificar: (a) contenedores en ejecución (docker ps), (b) estado de Traefik (docker logs traefik), (c) reglas del firewall interno (ufw status / iptables -L).",
            "Si el VPS está suspendido por pago, regularizar la situación con Hetzner y solicitar el restablecimiento.",
            "Si el VPS está activo pero los servicios están caídos, reiniciar los contenedores con docker-compose -f docker-compose.prod.yml up -d.",
            "Verificar que el certificado TLS de Let's Encrypt esté vigente (certbot certificates) — un certificado expirado hace que los navegadores rechacen la conexión HTTPS sin agotar el timeout (el error sería más rápido).",
        });

        H2(body, "4.2. Acciones de mediano plazo (próximos 7 días)");

        NumberedList(body, new[] {
            "Implementar un health check externo (UptimeRobot, Healthchecks.io, BetterStack) con alerta por email/SMS ante caída.",
            "Documentar el procedimiento de recuperación ante desastre en 10-INFRAESTRUCTURA-PRODUCCION.md, con un runbook ejecutable paso a paso.",
            "Configurar un backup externo (Backblaze B2 o Hetzner Storage Box) y verificar la restauración con periodicidad semanal.",
            "Establecer un canal de notificaciones automáticas de despliegue (Slack, Discord, email) para que cualquier cambio en producción quede registrado.",
        });

        H2(body, "4.3. Acciones de largo plazo (próximo mes)");

        NumberedList(body, new[] {
            "Evaluar la migración a un esquema con redundancia geográfica (dos VPS en regiones distintas, o servicio gestionado con alta disponibilidad).",
            "Implementar pipeline CI/CD con verificación de despliegue (smoke tests e2e que validen /health tras cada deploy).",
            "Sincronizar la documentación del despliegue con el estado real en cada cambio de infraestructura.",
        });

        body.Append(PageBreak());

        // ════════ 5. ACLARACIÓN SOBRE NETLIFY ════════
        H1(body, "5. Aclaración sobre el despliegue y Netlify");

        Para(body,
            "La consulta indica revisar el despliegue en Netlify. Sin embargo, " +
            "el proyecto no está desplegado en Netlify en ninguna de sus formas " +
            "(Netlify App, Netlify Functions, Netlify Edge). " +
            "El repositorio no contiene ningún archivo de configuración de Netlify:");

        // Verify absence
        CodeBlock(body, "$ find . -name \"netlify.toml\" -o -name \".netlify*\" -o -name \"_redirects\" -o -name \"_headers\"");
        Para(body, "(búsqueda recursiva en el repositorio) — resultado: ningún archivo encontrado.", italic: true);

        CodeBlock(body, "$ grep -rln \"netlify\" --include=\"*.json\" --include=\"*.yml\" --include=\"*.yaml\" --include=\"*.toml\" --include=\"*.md\"");
        Para(body, "Únicas referencias: dependencias transitivas dentro de node_modules/ (paquetes de ESLint, " +
            "no relacionadas con un despliegue real).", italic: true);

        H2(body, "5.1. Plataforma de despliegue real");

        Para(body, "El despliegue es 100% self-hosted en un VPS de Hetzner (Ubuntu 22.04 LTS) con la siguiente pila:");

        ModernTable(body,
            new[] { "Capa", "Tecnología" },
            new[] {
                new[] { "Servidor", "Hetzner VPS (Ubuntu 22.04, srv1334142)" },
                new[] { "Orquestación", "Docker + docker-compose (archivo docker-compose.prod.yml)" },
                new[] { "Reverse proxy", "Traefik v2" },
                new[] { "TLS", "Let's Encrypt (renovación automática)" },
                new[] { "Dominio", "geodatabase.mcconsultorias.com.co" },
                new[] { "DNS", "Apunta a 2.24.97.152" },
            }
        );

        Para(body,
            "Esta configuración está documentada en 10-INFRAESTRUCTURA-PRODUCCION.md (Operación por 1 año) " +
            "y en docker-compose.prod.yml del repositorio. La decisión de self-hosting se justificó en su " +
            "momento por el menor costo operativo (USD 130–180/año vs. USD 300–480/año de un stack " +
            "gestionado equivalente en Railway/Supabase/Cloudflare).",
            italic: true);

        // Closing
        body.Append(PageBreak());
        H1(body, "6. Cierre y siguiente paso");

        Para(body,
            "El estado actual del despliegue es inconsistente con lo declarado en el Informe Técnico de Avance " +
            "(Anexo 1) y en la Solicitud de Desembolso de la cláusula 3.2. Antes de proceder con el pago, se " +
            "recomienda:");

        NumberedList(body, new[] {
            "Restablecer la disponibilidad del VPS y de la URL geodatabase.mcconsultorias.com.co.",
            "Verificar de extremo a extremo (carga del visor, login, consulta de zonas, carga de capas) y documentar con capturas de pantalla que se integren al Anexo 2.",
            "Actualizar el Anexo 1 (Informe Técnico) y la Solicitud de Desembolso para que reflejen el estado real posterior al restablecimiento, con la fecha exacta de la verificación funcional.",
            "Implementar las acciones de la §4 (health checks externos, runbook de recuperación) para que esta situación no se repita.",
        });

        Para(body,
            "Reporte generado el 25 de junio de 2026. Este documento se anexa al expediente del contrato " +
            "UTL:001 como soporte de la verificación independiente de la cláusula 3.2.",
            italic: true);

        body.Append(sectPr);
    }

    private static void CodeBlock(Body body, string code)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = "F1F5F9" },
                new Indentation { Left = "240", Right = "240" },
                new SpacingBetweenLines { After = "60" }
            ),
            new Run(
                new RunProperties(
                    new RunFonts { Ascii = "Consolas", HighAnsi = "Consolas" },
                    new FontSize { Val = "18" },
                    new Color { Val = SoftBlack }
                ),
                new Text(code) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
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
                new RunProperties(new FontSize { Val = "56" }, new Color { Val = Red }, new Bold()),
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
                new RunProperties(new FontSize { Val = "40" }, new Color { Val = Navy }, new Bold()),
                new Text("Reporte de Despliegue")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "28" }, new Color { Val = Red }, new Italic()),
                new Text("Verificación de la plataforma en producción")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = SoftBlack }),
                new Text("Soporte de la cláusula 3.2 — Contrato UTL:001")
            )
        ));

        var coverTable = new Table();
        coverTable.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Red },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = Red },
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
            ("Documento", "Reporte de despliegue — Verificación de la plataforma"),
            ("Contrato", "UTL:001"),
            ("Soporta", "Solicitud de desembolso — Cláusula 3.2"),
            ("URL verificada", "geodatabase.mcconsultorias.com.co"),
            ("Estado verificado", "NO OPERATIVO (timeout en puertos 80/443/8080)"),
            ("DNS", "Resuelve a 2.24.97.152"),
            ("Ping", "Responde (145–383 ms) — host no caído, servicio no accesible"),
            ("Fecha de verificación", "25 de junio de 2026"),
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
                new RunProperties(new FontSize { Val = "24" }, new Color { Val = Red }, new Bold()),
                new Text("VERIFICACIÓN INDEPENDIENTE · ACCIÓN REQUERIDA")
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

    private static void ModernTable(Body body, string[] headers, string[][] data)
    {
        body.Append(BuildTable(headers, data));
    }

    private static Table BuildTable(string[] headers, string[][] data)
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
                    new ParagraphBorders(new BottomBorder { Val = BorderValues.Single, Size = 4, Space = 4, Color = Red })
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
                new TopBorder { Val = BorderValues.Single, Size = 4, Space = 0, Color = Red },
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
                    new Text("MC Consultorías & Capacitación S.A.S. · Verificación independiente 25-jun-2026") { Space = SpaceProcessingModeValues.Preserve })
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
