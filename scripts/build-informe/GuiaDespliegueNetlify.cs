using System;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class GuiaDespliegueNetlify
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
    private const string NoteFill = "FEF3C7";
    private const string NoteBorder = "FCD34D";

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

        AddHeader(mainPart, sectPr, "Guía de despliegue en Netlify · Geodatabase Luruaco");
        AddFooter(mainPart, sectPr);

        CoverPage(body);
        body.Append(PageBreak());

        // ════════ 0. CAMBIO RECIENTE: BACKEND EN HOSTINGER ════════
        H1(body, "0. Cambio reciente — Backend en Hostinger (no Hetzner)");
        Para(body,
            "A partir de julio de 2026 el backend dejó de estar alojado en un VPS de Hetzner " +
            "y se migró a un VPS de Hostinger. La verificación de DNS así lo confirma:");

        ModernTable(body,
            new[] { "Comprobación", "Resultado" },
            new[] {
                new[] { "nslookup geodatabase.mcconsultorias.com.co", "2.24.97.152" },
                new[] { "Reverse DNS 2.24.97.152", "srv1668992.hstgr.cloud" },
                new[] { "WHOIS de la IP", "Rango 2.24.64.0–2.24.127.255, netname: HOSTINGER-HOSTING, país US" },
            }
        );

        Para(body,
            "Implicaciones prácticas: el procedimiento de despliegue en Netlify es el mismo " +
            "(la SPA sigue en Netlify, el backend y la BD siguen en el mismo servidor de origen). " +
            "Solo cambia dónde se hacen las operaciones de mantenimiento del backend: el SSH " +
            "ahora se hace al host de Hostinger, no a srv1334142.hetzner.com.",
            italic: true);

        body.Append(PageBreak());

        // ════════ 1. CONTEXTO Y DECISIÓN ARQUITECTÓNICA ════════
        H1(body, "1. Contexto y decisión arquitectónica");
        H2(body, "1.1. ¿Por qué solo el frontend?");
        Para(body,
            "El proyecto tiene tres componentes con restricciones de hosting muy diferentes:");

        ModernTable(body,
            new[] { "Componente", "Tecnología", "Restricción", "¿Va a Netlify?" },
            new[] {
                new[] { "Frontend", "React 19 + Vite (build estático)", "Cualquier CDN", "Sí" },
                new[] { "Backend", "Go 1.22 + Fiber", "TCP socket persistente, JWT", "No (sigue en Hostinger)" },
                new[] { "Geodatabase", "PostgreSQL 15 + PostGIS 3.4", "Extensiones nativas, sistema de archivos", "No (sigue en Hostinger)" },
                new[] { "Tiles ortofoto", "2.378 archivos XYZ (259 MB)", "Volumen persistente en el VPS", "No (sigue en Hostinger)" },
            }
        );

        Para(body,
            "Netlify está optimizado para servir HTML/CSS/JS estático + funciones serverless. " +
            "Los binarios Go y PostGIS no corren en Netlify. La estrategia correcta es separar " +
            "frontend y backend, y dejar que Netlify proxie /api/*, /health y /tiles/* al " +
            "backend existente en Hostinger.");

        H2(body, "1.2. Lo que cambia (y lo que no)");
        ModernTable(body,
            new[] { "Antes", "Después" },
            new[] {
                new[] { "geodatabase.mcconsultorias.com.co/ → Nginx (VPS)", "geodatabase.mcconsultorias.com.co/ → Netlify" },
                new[] { "/api/* → Go/Fiber (VPS, red Docker interna)", "/api/* → proxy Netlify → Go/Fiber (Hostinger)" },
                new[] { "/health → Go/Fiber", "/health → proxy Netlify → Go/Fiber" },
                new[] { "/tiles/* → Nginx → volumen Docker", "/tiles/* → proxy Netlify → Nginx (Hostinger)" },
            }
        );

        Para(body,
            "El usuario final no nota diferencia: misma URL, mismo comportamiento, " +
            "mismo certificado TLS (Let's Encrypt — Netlify lo gestiona automáticamente " +
            "al configurar el dominio custom).",
            italic: true);

        body.Append(PageBreak());

        // ════════ 2. PRE-REQUISITOS ════════
        H1(body, "2. Pre-requisitos");

        H2(body, "2.1. Cuentas y accesos");
        BulletList(body, new[] {
            "Cuenta en Netlify (https://app.netlify.com) — el plan Free es suficiente para SPA estática.",
            "Acceso al panel de DNS del dominio mcconsultorias.com.co (puede estar en Hostinger o en el registrador del dominio).",
            "Acceso SSH/SFTP al VPS de Hostinger (srv1668992.hstgr.cloud o IP 2.24.97.152).",
            "Credenciales del panel de Hostinger (hPanel — https://hpanel.hostinger.com) para acceder al VPS y a la gestión DNS.",
            "Acceso al repositorio Git (GitHub, GitLab o Bitbucket) del proyecto.",
        });

        H2(body, "2.2. Estado del backend (BLOQUEANTE)");
        Note(body, "Importante",
            "Según el Reporte de Despliegue (25-jun-2026), el backend estaba caído. " +
            "Este paso es BLOQUEANTE — no se debe migrar a Netlify con el backend caído, " +
            "porque el resultado será un frontend inerte que no puede mostrar datos.");

        Para(body, "Antes del cutover, ejecutar desde cualquier terminal:");
        Code(body, "curl -I https://geodatabase.mcconsultorias.com.co/health");
        Para(body, "Esperado: HTTP/1.1 200 OK", italic: true);

        Code(body, "curl -s https://geodatabase.mcconsultorias.com.co/api/resumen");
        Para(body, "Esperado: JSON con el resumen institucional", italic: true);

        Code(body, "curl -I https://geodatabase.mcconsultorias.com.co/api/zonas");
        Para(body, "Esperado: HTTP/1.1 200 OK (puede ser 401 si requiere auth)", italic: true);

        Para(body, "Si alguno falla, restablecer primero el backend en Hostinger (ver §4).");

        H2(body, "2.3. Repositorio Git");
        Para(body, "El repositorio debe tener los archivos de configuración para Netlify (commiteados en este PR):");
        BulletList(body, new[] {
            "03-frontend/netlify.toml — configuración principal (apunta a Hostinger).",
            "03-frontend/public/_redirects — redirects declarativos (apunta a Hostinger).",
            "03-frontend/public/_headers — headers de seguridad y caché.",
            "03-frontend/.env.production — VITE_API_URL apunta al dominio público.",
            "03-frontend/package.json — con scripts build y dev (existente).",
        });

        body.Append(PageBreak());

        // ════════ 3. CONFIGURACIÓN DEL SITIO EN NETLIFY ════════
        H1(body, "3. Configuración del sitio en Netlify (paso a paso)");

        H2(body, "3.1. Crear el sitio");
        NumberedList(body, new[] {
            "Ir a https://app.netlify.com/start.",
            "Click en 'Import an existing project' → seleccionar el proveedor Git (GitHub/GitLab/Bitbucket).",
            "Autorizar a Netlify el acceso al repositorio.",
            "Seleccionar el repositorio del proyecto (geovisor-luruaco o equivalente).",
        });

        H2(body, "3.2. Configurar el build (lectura desde netlify.toml)");
        Para(body, "Netlify detecta automáticamente las instrucciones del netlify.toml:");
        ModernTable(body,
            new[] { "Campo", "Valor (leído del archivo)" },
            new[] {
                new[] { "Base directory", "03-frontend" },
                new[] { "Build command", "npm ci && npm run build" },
                new[] { "Publish directory", "dist" },
                new[] { "Node version", "22" },
                new[] { "VITE_API_URL", "https://geodatabase.mcconsultorias.com.co" },
            }
        );
        Para(body, "No es necesario cambiar nada — el netlify.toml es la fuente de verdad.", italic: true);

        H2(body, "3.3. Variables de entorno (opcional)");
        Para(body, "netlify.toml ya define VITE_API_URL en [build.environment], así que no es necesario configurar nada adicional. Si se quisiera cambiar (por ejemplo, para staging):");
        ModernTable(body,
            new[] { "Key", "Value" },
            new[] { new[] { "VITE_API_URL", "https://geodatabase.mcconsultorias.com.co" } }
        );

        H2(body, "3.4. Primer deploy");
        Para(body, "Netlify ejecutará automáticamente:");
        NumberedList(body, new[] {
            "npm ci — instala dependencias (usa package-lock.json para build determinístico).",
            "npm run build — ejecuta tsc -b && vite build → produce dist/.",
            "Publica el contenido de dist/ en una URL temporal tipo https://<random-name>.netlify.app.",
        });
        Para(body, "Verificar en la pestaña Deploys que el build terminó en verde.", italic: true);

        H2(body, "3.5. Configurar el dominio custom");
        NumberedList(body, new[] {
            "Site settings → Domain management → Add custom domain.",
            "Escribir: geodatabase.mcconsultorias.com.co.",
            "Netlify detectará que el dominio ya existe y preguntará cómo se quiere gestionar el DNS:",
        });
        BulletList(body, new[] {
            "Opción A — Netlify DNS (recomendado): migrar el registro NS del subdominio al panel de Netlify.",
            "Opción B — External DNS: agregar un CNAME geodatabase.mcconsultorias.com.co → <tu-sitio>.netlify.app en el registrador actual.",
        });
        Note(body, "DNS en Hostinger",
            "La zona DNS de mcconsultorias.com.co puede estar gestionada en el panel de " +
            "Hostinger (junto con el VPS) o en el registrador del dominio. Verificar dónde " +
            "están los registros NS antes de modificar nada.");

        Para(body, "Netlify provisionará automáticamente un certificado TLS vía Let's Encrypt (gratuito, renovación automática cada 60 días).");

        H2(body, "3.6. Verificación post-despliegue");
        Para(body, "Una vez que Netlify muestra el sitio como 'Live':");
        Code(body, "# 1. HTTPS al dominio principal\ncurl -I https://geodatabase.mcconsultorias.com.co/\n# Esperado: HTTP/2 200, server: Netlify\n\n# 2. Proxy de la API\ncurl -I https://geodatabase.mcconsultorias.com.co/api/zonas\n# Esperado: HTTP/2 200 (proxy al backend de Hostinger)\n\n# 3. Health check\ncurl -s https://geodatabase.mcconsultorias.com.co/health\n# Esperado: {\"status\":\"ok\",...}\n\n# 4. Tiles de la ortofoto\ncurl -I https://geodatabase.mcconsultorias.com.co/tiles/14/8623/12031.png\n# Esperado: HTTP/2 200, content-type: image/png\n\n# 5. Carga la SPA en el navegador y verifica la consola\n#    que no haya errores CORS ni 404.");

        body.Append(PageBreak());

        // ════════ 4. CONFIGURACIÓN DEL BACKEND EN HOSTINGER ════════
        H1(body, "4. Configuración del backend en Hostinger (sin cambios)");

        Para(body, "El backend no se toca. Sigue corriendo como hasta ahora en el VPS de Hostinger.", bold: true);

        H2(body, "4.1. Acceso al VPS de Hostinger");
        Para(body, "Para tareas de mantenimiento (reiniciar contenedores, ver logs, aplicar actualizaciones), acceder al VPS por SSH:");
        Code(body, "# Desde una terminal con acceso SSH al VPS:\nssh -p <puerto> root@srv1668992.hstgr.cloud\n# o usar la IP directa:\nssh -p <puerto> root@2.24.97.152");
        Para(body, "El puerto SSH no es 22 por defecto en Hostinger (varía según configuración). Consultar el panel de Hostinger → VPS → Acceso SSH.", italic: true);

        H2(body, "4.2. CORS del backend");
        Para(body, "Verificar que el backend Go (en 02-backend/main.go y auth.go) tiene configurado correctamente el origen de Netlify como permitido:");
        Code(body, "# En el VPS de Hostinger:\ncat ~/geovisor-luruaco/02-backend/.env\n# Confirmar que CORS_ALLOW_ORIGINS incluye el dominio nuevo");

        Note(body, "CORS",
            "Si el backend se desplegó con CORS_ALLOW_ORIGINS=* (default para dev), " +
            "no hace falta cambiar. Si está restringido a un dominio específico, " +
            "agregar https://geodatabase.mcconsultorias.com.co y reiniciar el contenedor.");

        Code(body, "cd ~/geovisor-luruaco\ndocker-compose -f docker-compose.prod.yml restart backend");

        H2(body, "4.3. Tiles de la ortofoto");
        Para(body,
            "Los tiles (/tiles/14/8623/12031.png, etc.) viven en el volumen persistente del VPS " +
            "de Hostinger. Las redirecciones en netlify.toml los proxean transparentemente, así " +
            "que el frontend no nota el cambio. No hace falta migrar los tiles.");

        H2(body, "4.4. Health check del backend");
        Para(body, "El endpoint /health ya está implementado en 02-backend/main.go:");
        Code(body, "app.Get(\"/health\", func(c *fiber.Ctx) error {\n    return c.JSON(fiber.Map{\n        \"status\":    \"ok\",\n        \"message\":   \"Luruaco API funcionando\",\n        \"timestamp\": time.Now().Format(time.RFC3339),\n    })\n})");
        Note(body, "Importante",
            "Este endpoint no verifica la conexión a la base de datos, solo que el " +
            "proceso Go esté vivo. Para un health check real (con verificación de BD), " +
            "considerar añadir una query SELECT 1 antes de retornar.");

        body.Append(PageBreak());

        // ════════ 5. ROLLBACK ════════
        H1(body, "5. Rollback (si algo sale mal)");

        Para(body, "Netlify permite hacer rollback a un deploy anterior en un solo click:");
        NumberedList(body, new[] {
            "Deploys → seleccionar el deploy anterior al problemático.",
            "Click en 'Publish deploy'.",
            "Netlify restaura la versión anterior en menos de 30 segundos.",
        });
        Para(body,
            "Si el problema es del backend (no de Netlify), el rollback de Netlify " +
            "no ayuda — hay que ir al VPS de Hostinger y restaurar el contenedor manualmente.",
            italic: true);

        body.Append(PageBreak());

        // ════════ 6. COSTOS ════════
        H1(body, "6. Costos y plan recomendado");
        ModernTable(body,
            new[] { "Plan", "Precio", "Características", "¿Suficiente?" },
            new[] {
                new[] { "Free (Starter)", "$0/mes", "100 GB bandwidth, 300 build-minutos, HTTPS automático", "Sí para este proyecto" },
                new[] { "Pro", "$19/mes", "1 TB bandwidth, Forms, Identity, Functions", "Solo si se añaden funciones serverless" },
            }
        );
        Para(body,
            "El plan Free es más que suficiente para la SPA actual (~5 MB de bundle + " +
            "assets + tiles proxiados). El ancho de banda consumido es el del tráfico " +
            "de usuarios reales a la plataforma.",
            italic: true);
        Para(body,
            "Costo del backend en Hostinger: depende del plan VPS contratado " +
            "(Cloud Startup, Cloud Professional, etc.). Verificar en el panel de Hostinger.",
            italic: true);

        body.Append(PageBreak());

        // ════════ 7. RESUMEN DE CAMBIOS ════════
        H1(body, "7. Resumen de cambios en el repositorio");

        H2(body, "7.1. Archivos creados");
        ModernTable(body,
            new[] { "Archivo", "Propósito" },
            new[] {
                new[] { "03-frontend/netlify.toml", "Configuración principal (build, redirects, headers) — actualizado a Hostinger" },
                new[] { "03-frontend/public/_redirects", "Redirects declarativos (respaldo legible) — actualizado a Hostinger" },
                new[] { "03-frontend/public/_headers", "Headers de seguridad y caché (respaldo legible)" },
                new[] { "docs/GUIA-DESPLIEGUE-NETLIFY.md", "Esta guía en formato Markdown (v1.1 — Hostinger)" },
                new[] { "docs/GUIA-DESPLIEGUE-NETLIFY.docx", "Esta guía en formato DOCX (v1.1 — Hostinger)" },
            }
        );

        H2(body, "7.2. Archivos modificados");
        ModernTable(body,
            new[] { "Archivo", "Cambio" },
            new[] {
                new[] { "03-frontend/.env.production", "VITE_API_URL apunta al dominio; comentario actualizado a Hostinger" },
            }
        );

        H2(body, "7.3. Archivos no modificados");
        BulletList(body, new[] {
            "02-backend/** — backend sin cambios (sigue en Hostinger).",
            "04-base-de-datos/** — esquema y migraciones sin cambios.",
            "docker-compose.prod.yml — sigue orquestando backend + PostGIS + tiles en el VPS.",
        });

        H2(body, "7.4. Documentos que requieren actualización posterior");
        ModernTable(body,
            new[] { "Documento", "Cambio requerido" },
            new[] {
                new[] { "01-ARQUITECTURA.md", "VPS: srv1334142 (Hetzner) → srv1668992.hstgr.cloud (Hostinger, IP 2.24.97.152)" },
                new[] { "06-DESPLIEGUE.md", "Sección Infraestructura y todas las menciones a Hetzner" },
                new[] { "10-INFRAESTRUCTURA-PRODUCCION.md", "Opción recomendada: VPS único (Hetzner CX32) → reescribir para Hostinger" },
                new[] { "02-backend/README.md", "Agregar Hostinger como host primario (Railway queda como alternativa)" },
            }
        );
        Para(body, "Esta actualización es documental, no técnica — el código y los archivos de configuración no cambian, solo las descripciones en texto.", italic: true);

        body.Append(PageBreak());

        // ════════ 8. CHECKLIST FINAL ════════
        H1(body, "8. Checklist de cierre");

        H2(body, "8.1. Pre-despliegue");
        ModernTable(body,
            new[] { "OK", "Verificación" },
            new[] {
                new[] { "[ ]", "Repositorio commiteado y pusheado a GitHub/GitLab." },
                new[] { "[ ]", "Backend en Hostinger responde /health con 200 OK." },
                new[] { "[ ]", "Backend en Hostinger responde /api/resumen con JSON válido." },
                new[] { "[ ]", "CORS del backend permite el dominio geodatabase.mcconsultorias.com.co." },
                new[] { "[ ]", "Cuenta en Netlify creada y vinculada al repositorio." },
                new[] { "[ ]", "DNS del subdominio geodatabase localizado (Hostinger o registrador)." },
            }
        );

        H2(body, "8.2. Post-despliegue");
        ModernTable(body,
            new[] { "OK", "Verificación" },
            new[] {
                new[] { "[ ]", "Sitio creado en Netlify con build verde." },
                new[] { "[ ]", "Dominio custom configurado con TLS activo (HTTPS sin warnings)." },
                new[] { "[ ]", "curl https://geodatabase.mcconsultorias.com.co/api/zonas responde 200." },
                new[] { "[ ]", "curl https://geodatabase.mcconsultorias.com.co/health responde 200." },
                new[] { "[ ]", "curl https://geodatabase.mcconsultorias.com.co/tiles/.../...png responde 200 image/png." },
                new[] { "[ ]", "SPA carga en el navegador sin errores en la consola." },
                new[] { "[ ]", "Pruebas de humo del Anexo 2 (login, vista de zonas, dashboard) funcionan." },
                new[] { "[ ]", "Anexo 2 (Capturas) regenerado con screenshots reales del frontend en Netlify." },
            }
        );

        H2(body, "8.3. Documentación contractual");
        ModernTable(body,
            new[] { "OK", "Documento" },
            new[] {
                new[] { "[ ]", "Regenerar Anexo 1 (Informe Técnico) si cambió la fecha o el estado de despliegue." },
                new[] { "[ ]", "Regenerar Reporte de Despliegue tras la verificación post-Netlify." },
                new[] { "[ ]", "Actualizar 01-ARQUITECTURA.md, 06-DESPLIEGUE.md, 10-INFRAESTRUCTURA-PRODUCCION.md para reflejar Hostinger." },
                new[] { "[ ]", "Archivar esta guía en el expediente contractual del UTL:001." },
            }
        );

        Para(body, " ");
        Para(body,
            "Documento generado el 2 de julio de 2026 (versión 1.1 — backend en Hostinger) " +
            "como parte del procedimiento de despliegue en Netlify del frontend del Contrato " +
            "UTL:001.",
            italic: true);
    }

    private static void Note(Body body, string title, string text)
    {
        var note = new Table();
        note.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = NoteBorder },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = NoteBorder },
                new LeftBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = NoteBorder },
                new RightBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = NoteBorder },
                new InsideHorizontalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" },
                new InsideVerticalBorder { Val = BorderValues.None, Size = 0, Space = 0, Color = "auto" }
            ),
            new TableCellMarginDefault(
                new TopMargin { Width = "100", Type = TableWidthUnitValues.Dxa },
                new StartMargin { Width = "200", Type = TableWidthUnitValues.Dxa },
                new BottomMargin { Width = "100", Type = TableWidthUnitValues.Dxa },
                new EndMargin { Width = "200", Type = TableWidthUnitValues.Dxa }
            )
        ));
        var grid = new TableGrid();
        grid.Append(new GridColumn { Width = "9026" });
        note.Append(grid);
        note.Append(new TableRow(
            new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "9026", Type = TableWidthUnitValues.Dxa },
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = NoteFill }
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = "92400E" }), new Text($"⚠ {title}"))
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve })
                )
            )
        ));
        body.Append(note);
    }

    private static void Code(Body body, string code)
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
                    new FontSize { Val = "18" }
                ),
                new Text(code) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
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
                new RunProperties(new FontSize { Val = "44" }, new Color { Val = Navy }, new Bold()),
                new Text("Guía de Despliegue en Netlify")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "28" }, new Color { Val = Teal }, new Italic()),
                new Text("Frontend del proyecto Geodatabase Luruaco")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "22" }, new Color { Val = SoftBlack }),
                new Text("geodatabase.mcconsultorias.com.co · Frontend en Netlify, backend y BD en Hetzner")
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
            ("Documento", "Guía de despliegue en Netlify (v1.1)"),
            ("Contrato", "UTL:001"),
            ("Alcance", "Migración del frontend (SPA) a Netlify"),
            ("Backend y BD", "Sin cambios — siguen en VPS Hostinger (srv1668992.hstgr.cloud)"),
            ("Dominio", "geodatabase.mcconsultorias.com.co"),
            ("Plan Netlify", "Free (gratuito, suficiente para la SPA actual)"),
            ("Tiempo estimado", "30–45 minutos (incluye verificación del backend)"),
            ("Fecha", "2 de julio de 2026"),
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
                if (i % 2 == 1) tcPr.Append(new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = ZebraLight });
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
