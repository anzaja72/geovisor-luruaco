using System;
using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using WpPageSize = DocumentFormat.OpenXml.Wordprocessing.PageSize;

namespace BuildInforme;

public static class GuiaDespliegueCompleto
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
    private const string SuccessFill = "DCFCE7";
    private const string SuccessBorder = "86EFAC";
    private const string CodeFill = "F1F5F9";

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

        AddHeader(mainPart, sectPr, "Guía completa de despliegue · Backend Hostinger + Frontend Netlify");
        AddFooter(mainPart, sectPr);

        CoverPage(body);
        body.Append(PageBreak());

        // ════════ §0. VISIÓN GENERAL ════════
        H1(body, "0. Visión general de la arquitectura");
        Para(body, "La arquitectura objetivo del despliegue es:");

        DiagramBlock(body, "┌─────────────────────────────────────────────────────────────┐\n│              USUARIO FINAL (navegador)                          │\n└───────────────────────────┬─────────────────────────────────┘\n                            │ HTTPS\n                            ▼\n┌─────────────────────────────────────────────────────────────┐\n│  Netlify (CDN global) — Frontend SPA React/Vite              │\n│  https://geodatabase.mcconsultorias.com.co/                  │\n│                                                              │\n│  /api/*  → https://geodatabase.mcconsultorias.com.co/api/*   │\n│  /health → https://geodatabase.mcconsultorias.com.co/health  │\n│  /tiles/* → https://geodatabase.mcconsultorias.com.co/...   │\n│  /*      → /index.html (SPA)                                 │\n└───────────────────────────┬─────────────────────────────────┘\n                            │ HTTPS (proxy)\n                            ▼\n┌─────────────────────────────────────────────────────────────┐\n│  Hostinger VPS (srv1668992.hstgr.cloud, IP 2.24.97.152)       │\n│  ┌──────────────────────────────────────────────────────┐   │\n│  │ Traefik v3 (TLS vía Let's Encrypt)                    │   │\n│  │   /api/*   → backend:8080                             │   │\n│  │   /tiles/* → volumen persistente                      │   │\n│  └──────────────────────────────────────────────────────┘   │\n│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │\n│  │  backend   │  │  postgis   │  │  frontend  │              │\n│  │  Go/Fiber  │  │ PostGIS 3.4│  │ Nginx (UI) │              │\n│  │  port 8080 │  │ port 5432  │  │ port 80    │              │\n│  └────────────┘  └────────────┘  └────────────┘              │\n└─────────────────────────────────────────────────────────────┘");

        ModernTable(body,
            new[] { "Componente", "Hosting", "Imagen / Servicio" },
            new[] {
                new[] { "PostgreSQL + PostGIS 3.4", "Hostinger (VPS)", "postgis/postgis:16-3.4" },
                new[] { "Backend Go 1.22 (Fiber)", "Hostinger (VPS)", "Build multi-stage (Dockerfile del proyecto)" },
                new[] { "Frontend React (build estático)", "Netlify", "netlify deploy (HTML/CSS/JS)" },
                new[] { "Tiles ortofoto (259 MB)", "Hostinger (VPS)", "Volumen Docker persistente" },
                new[] { "Reverse proxy + TLS", "Hostinger (VPS)", "Traefik v3 (Let's Encrypt)" },
                new[] { "DNS del dominio", "Hostinger (hPanel)", "A record geodatabase → 2.24.97.152" },
            }
        );

        body.Append(PageBreak());

        // ════════ PARTE I — HOSTINGER ════════
        PartDivider(body, "PARTE I — Desplegar el backend en Hostinger");

        // §1 Pre-requisitos
        H1(body, "1. Pre-requisitos del VPS de Hostinger");
        ModernTable(body,
            new[] { "Requisito", "Verificación" },
            new[] {
                new[] { "VPS activo (srv1668992.hstgr.cloud)", "Panel hPanel → VPS" },
                new[] { "Acceso SSH al VPS", "ssh -p <puerto> root@srv1668992.hstgr.cloud" },
                new[] { "Dominio geodatabase.mcconsultorias.com.co apuntando al VPS", "DNS A record → 2.24.97.152" },
                new[] { "Ubuntu 22.04 LTS o Debian 12", "lsb_release -a" },
                new[] { "Al menos 4 GB de RAM y 40 GB de disco libre", "free -h && df -h" },
                new[] { "Privilegios de root o sudo", "sudo -v" },
            }
        );

        // §2 Instalación
        H1(body, "2. Instalación inicial del VPS (one-time)");
        Para(body, "Conectarse al VPS por SSH y ejecutar:");
        Code(body, "# 1. Actualizar el sistema\napt update && apt upgrade -y\n\n# 2. Instalar dependencias básicas\napt install -y curl wget git nano ufw ca-certificates gnupg lsb-release\n\n# 3. Instalar Docker y Docker Compose (método oficial)\ninstall -m 0755 -d /etc/apt/keyrings\ncurl -fsSL https://download.docker.com/linux/ubuntu/gpg | \\\n  gpg --dearmor -o /etc/apt/keyrings/docker.gpg\nchmod a+r /etc/apt/keyrings/docker.gpg\n\necho \\\n  \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \\\n  https://download.docker.com/linux/ubuntu \\\n  $(lsb_release -cs) stable\" | \\\n  tee /etc/apt/sources.list.d/docker.list > /dev/null\n\napt update\napt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin\n\n# 4. Agregar tu usuario al grupo docker (opcional)\nusermod -aG docker $USER\n\n# 5. Configurar el firewall (UFW)\nufw allow OpenSSH\nufw allow 80/tcp\nufw allow 443/tcp\nufw --force enable\nufw status\n\n# 6. Verificar Docker\ndocker --version\ndocker compose version");

        // §3 Clonar
        H1(body, "3. Clonar el repositorio del proyecto");
        Code(body, "# Crear directorio de la app\nmkdir -p /opt/geodatabase\ncd /opt/geodatabase\n\n# Clonar el repo\ngit clone https://github.com/<tu-usuario>/geovisor-luruaco.git .\n\n# Verificar la estructura\nls -la\n# Debes ver: 02-backend/  03-frontend/  04-base-de-datos/  docker-compose.vps.yml  ...");

        // §4 .env
        H1(body, "4. Crear el archivo .env con las credenciales");
        Code(body, "cd /opt/geodatabase\n\ncat > .env <<'EOF'\n# === Base de datos (PostgreSQL + PostGIS) ===\nDB_PASSWORD=CAMBIAR_POR_CONTRASEÑA_SEGURA_DE_32_CARACTERES\n\n# === Autenticación JWT ===\nJWT_SECRET=CAMBIAR_POR_SECRETO_JWT_ALEATORIO_DE_64_CARACTERES\n\n# === Usuario administrador inicial ===\nADMIN_EMAIL=admin@mcconsultorias.com.co\nADMIN_PASSWORD=CAMBIAR_POR_CONTRASEÑA_FUERTE_DEL_ADMIN\n\n# === CORS ===\nCORS_ALLOW_ORIGINS=https://geodatabase.mcconsultorias.com.co,http://localhost:5173\nEOF\n\n# Proteger el archivo (contiene secretos)\nchmod 600 .env");

        H2(body, "Cómo generar los secretos");
        Code(body, "# DB_PASSWORD (32 caracteres)\nopenssl rand -hex 16\n\n# JWT_SECRET (64 caracteres)\nopenssl rand -hex 32\n\n# ADMIN_PASSWORD (mínimo 16 caracteres)\nopenssl rand -base64 24");

        Note(body, "Importante — guarda los secretos",
            "Anota estos valores en un lugar seguro (gestor de contraseñas). Si pierdes JWT_SECRET, " +
            "todos los tokens emitidos quedan invalidados. Si pierdes DB_PASSWORD, no podrás " +
            "conectarte a la base de datos.");

        // §5 Levantar
        H1(body, "5. Compilar e iniciar los contenedores");
        Code(body, "cd /opt/geodatabase\n\n# Construir las imágenes (backend Go + frontend estático)\ndocker compose -f docker-compose.vps.yml build\n\n# Levantar los servicios en segundo plano\ndocker compose -f docker-compose.vps.yml up -d\n\n# Verificar el estado\ndocker compose -f docker-compose.vps.yml ps\n\n# Salida esperada:\n# NAME                STATUS              PORTS\n# geodb-postgis       Up (healthy)        5432/tcp\n# geodb-backend       Up                  8080/tcp\n# geodb-frontend      Up                  80/tcp");

        // §6 Migraciones
        H1(body, "6. Ejecutar las migraciones de la base de datos");
        Para(body, "Las migraciones SQL están en 04-base-de-datos/. Hay que ejecutarlas en orden:");
        Code(body, "# Esperar a que PostGIS esté listo\nsleep 10\ndocker exec geodb-postgis pg_isready -U eco_admin -d restauracion_ecologica\n\n# Ejecutar cada migración en orden\nfor f in /opt/geodatabase/04-base-de-datos/0*.sql; do\n  echo \"Aplicando $f...\"\n  docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica < \"$f\"\ndone\n\n# Verificar las tablas creadas\ndocker exec geodb-postgis psql -U eco_admin -d restauracion_ecologica -c \"\\dt\"");

        // §7 Traefik
        H1(body, "7. Instalar y configurar Traefik (reverse proxy con TLS)");
        Para(body, "Traefik se encarga de enrutar el tráfico y emitir certificados TLS vía Let's Encrypt.");
        Code(body, "# Crear red compartida para Traefik + servicios\ndocker network create web\n\n# Crear directorio de configuración\nmkdir -p /opt/traefik && cd /opt/traefik\n\n# Crear el archivo acme.json (almacena los certificados)\ntouch acme.json && chmod 600 acme.json\n\n# Crear docker-compose.yml para Traefik\ncat > docker-compose.yml <<'EOF'\nservices:\n  traefik:\n    image: traefik:v3.0\n    container_name: traefik\n    command:\n      - \"--api.dashboard=false\"\n      - \"--providers.docker=true\"\n      - \"--providers.docker.exposedbydefault=false\"\n      - \"--providers.docker.network=web\"\n      - \"--entrypoints.web.address=:80\"\n      - \"--entrypoints.web.http.redirections.entrypoint.to=websecure\"\n      - \"--entrypoints.web.http.redirections.entrypoint.scheme=https\"\n      - \"--entrypoints.websecure.address=:443\"\n      - \"--certificatesresolvers.letsencrypt.acme.tlschallenge=true\"\n      - \"--certificatesresolvers.letsencrypt.acme.email=angelzambranojaraba@gmail.com\"\n      - \"--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json\"\n    ports:\n      - \"80:80\"\n      - \"443:443\"\n    volumes:\n      - /var/run/docker.sock:/var/run/docker.sock:ro\n      - ./letsencrypt:/letsencrypt\n    networks:\n      - web\n    restart: unless-stopped\n\nnetworks:\n  web:\n    external: true\nEOF\n\n# Iniciar Traefik\ndocker compose up -d\n\n# Conectar el frontend a la red 'web' (donde escucha Traefik)\ndocker network connect web geodb-frontend");

        // §8 DNS
        H1(body, "8. Configurar DNS");
        Para(body, "En el panel DNS de Hostinger (o del registrador), configura:");
        ModernTable(body,
            new[] { "Tipo", "Nombre", "Valor" },
            new[] {
                new[] { "A", "geodatabase", "2.24.97.152 (IP del VPS)" },
                new[] { "A", "@ (opcional)", "2.24.97.152" },
            }
        );
        Para(body, "Verificar la propagación:");
        Code(body, "nslookup geodatabase.mcconsultorias.com.co\n# Debe resolver a 2.24.97.152");

        // §9 Verificación
        H1(body, "9. Verificación del backend en Hostinger");
        Code(body, "# Health check interno\ncurl -s http://localhost:8080/health\n# Esperado: {\"status\":\"ok\",...}\n\n# Health check externo (vía Nginx/Traefik)\ncurl -s https://geodatabase.mcconsultorias.com.co/health\n# Esperado: igual al anterior\n\n# API de resumen\ncurl -s https://geodatabase.mcconsultorias.com.co/api/resumen\n# Esperado: JSON con sitios visitados, reportados, categorías\n\n# Login con el usuario admin\ncurl -X POST https://geodatabase.mcconsultorias.com.co/api/auth/login \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"email\":\"admin@mcconsultorias.com.co\",\"password\":\"<tu-contraseña>\"}'\n\n# Verificar tiles de la ortofoto\ncurl -I https://geodatabase.mcconsultorias.com.co/tiles/14/8623/12031.png\n# Esperado: HTTP/1.1 200 OK, content-type: image/png");

        Note(body, "Si los curls externos fallan",
            "Esperar 2-3 minutos (Traefik está emitiendo el certificado TLS). Verificar logs con " +
            "`docker logs traefik`. Verificar que el firewall permite 80/443 con `ufw status`.");

        body.Append(PageBreak());

        // ════════ PARTE II — NETLIFY ════════
        PartDivider(body, "PARTE II — Desplegar el frontend en Netlify");

        H1(body, "10. Pre-requisitos para Netlify");
        ModernTable(body,
            new[] { "Requisito", "Verificación" },
            new[] {
                new[] { "Backend accesible públicamente en Hostinger", "curl https://geodatabase.mcconsultorias.com.co/health" },
                new[] { "Repositorio del proyecto en GitHub/GitLab", "https://github.com/<user>/geovisor-luruaco" },
                new[] { "Cuenta en Netlify", "https://app.netlify.com" },
                new[] { "netlify.toml ya commiteado en el repo", "cat 03-frontend/netlify.toml" },
            }
        );

        H1(body, "11. Conectar el repositorio a Netlify");
        NumberedList(body, new[] {
            "Ir a https://app.netlify.com/start.",
            "Click en Add new site → Import an existing project.",
            "Seleccionar el proveedor Git y autorizar.",
            "Buscar y seleccionar el repositorio geovisor-luruaco.",
            "Netlify detecta automáticamente la configuración de netlify.toml:",
        });
        ModernTable(body,
            new[] { "Campo", "Valor" },
            new[] {
                new[] { "Base directory", "03-frontend" },
                new[] { "Build command", "npm ci && npm run build" },
                new[] { "Publish directory", "dist" },
                new[] { "Branch to deploy", "main" },
            }
        );
        Para(body, "Click en Deploy site. Netlify ejecuta el build (1-3 min) y publica en una URL temporal tipo https://random-name-12345.netlify.app.", italic: true);

        H1(body, "12. Verificar que el frontend se conecta al backend");
        Para(body, "Una vez en verde, abrir la URL temporal en el navegador:");
        BulletList(body, new[] {
            "La SPA debe cargar.",
            "En la consola del navegador (F12) no debe haber errores CORS ni 404.",
            "El login debe funcionar con admin@mcconsultorias.com.co + contraseña.",
        });
        Note(body, "Si hay errores CORS",
            "Verificar en el VPS: cat /opt/geodatabase/.env | grep CORS. Debe incluir " +
            "CORS_ALLOW_ORIGINS=https://geodatabase.mcconsultorias.com.co. Si no, corregir y reiniciar: " +
            "cd /opt/geodatabase && docker compose -f docker-compose.vps.yml restart backend");

        H1(body, "13. Configurar el dominio custom geodatabase.mcconsultorias.com.co");
        Note(body, "Importante",
            "Si el DNS actual apunta el dominio al VPS de Hostinger, hay que cambiarlo para que " +
            "apunte a Netlify. El VPS seguirá sirviendo el backend vía proxy desde Netlify.");

        H2(body, "Opción A — Netlify DNS (recomendado)");
        NumberedList(body, new[] {
            "Site settings → Domain management → Add custom domain.",
            "Escribir geodatabase.mcconsultorias.com.co.",
            "Netlify muestra 4 nameservers (dns1.p01.nsone.com, etc.).",
            "En el panel DNS de Hostinger, cambiar los nameservers del subdominio geodatabase por los de Netlify.",
            "Esperar la propagación (1-24 horas, usualmente 1-2 horas).",
            "Netlify provisionará el certificado TLS (Let's Encrypt).",
            "Click en HTTPS → Verify DNS (botón verde).",
        });

        H2(body, "Opción B — DNS externo (Hostinger)");
        NumberedList(body, new[] {
            "Site settings → Domain management → Add custom domain.",
            "Escribir geodatabase.mcconsultorias.com.co.",
            "En el panel DNS de Hostinger, agregar:",
        });
        ModernTable(body,
            new[] { "Tipo", "Nombre", "Valor" },
            new[] { new[] { "CNAME", "geodatabase", "<tu-sitio>.netlify.app" } }
        );
        Para(body, "Esperar la propagación. Click en HTTPS → Verify DNS.");

        H1(body, "14. Verificación final end-to-end");
        Para(body, "Una vez que Netlify muestra el certificado TLS activo:");
        Code(body, "# 1. Frontend en Netlify\ncurl -I https://geodatabase.mcconsultorias.com.co/\n# Esperado: HTTP/2 200, server: Netlify\n\n# 2. Proxy de la API\ncurl -I https://geodatabase.mcconsultorias.com.co/api/zonas\n# Esperado: HTTP/2 200 (proxy al backend de Hostinger)\n\n# 3. Health check\ncurl -s https://geodatabase.mcconsultorias.com.co/health\n# Esperado: {\"status\":\"ok\",...}\n\n# 4. Tiles\ncurl -I https://geodatabase.mcconsultorias.com.co/tiles/14/8623/12031.png\n# Esperado: HTTP/2 200, content-type: image/png\n\n# 5. Login en el navegador\n# https://geodatabase.mcconsultorias.com.co/\n# Usuario: admin@mcconsultorias.com.co\n# Contraseña: <la que pusiste en ADMIN_PASSWORD>");

        SuccessNote(body, "Si todo funciona: despliegue completo 🎉");

        body.Append(PageBreak());

        // ════════ PARTE III — OPERACIÓN ════════
        PartDivider(body, "PARTE III — Operación y mantenimiento");

        H1(body, "15. Operaciones frecuentes en el VPS");
        Code(body, "# Ver logs del backend\ndocker logs -f geodb-backend\n\n# Reiniciar el backend (después de cambiar .env)\ncd /opt/geodatabase\ndocker compose -f docker-compose.vps.yml restart backend\n\n# Ver uso de disco\ndocker system df\ndf -h\n\n# Backup de la base de datos\ndocker exec geodb-postgis pg_dump -U eco_admin restauracion_ecologica \\\n  | gzip > /opt/backups/db-$(date +%Y%m%d-%H%M%S).sql.gz\n\n# Listar backups\nls -lh /opt/backups/\n\n# Restaurar un backup\ngunzip -c /opt/backups/db-20260702-120000.sql.gz | \\\n  docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica");

        H1(body, "16. Backups automáticos (cron)");
        Code(body, "cat > /opt/geodatabase/scripts/backup_db.sh <<'EOF'\n#!/bin/bash\nset -e\nBACKUP_DIR=\"/opt/backups\"\nmkdir -p \"$BACKUP_DIR\"\nTIMESTAMP=$(date +%Y%m%d-%H%M%S)\ndocker exec geodb-postgis pg_dump -U eco_admin restauracion_ecologica \\\n  | gzip > \"$BACKUP_DIR/db-$TIMESTAMP.sql.gz\"\n# Mantener solo los últimos 14 días\nfind \"$BACKUP_DIR\" -name \"db-*.sql.gz\" -mtime +14 -delete\nEOF\n\nchmod +x /opt/geodatabase/scripts/backup_db.sh\n\n# Programar ejecución diaria a las 03:00\necho \"0 3 * * * root /opt/geodatabase/scripts/backup_db.sh\" \\\n  | sudo tee /etc/cron.d/geodatabase-backup");

        H1(body, "17. Health checks externos (recomendado)");
        Para(body, "Configurar UptimeRobot o Healthchecks.io para alertar si la plataforma cae:");
        ModernTable(body,
            new[] { "Endpoint", "Frecuencia" },
            new[] {
                new[] { "https://geodatabase.mcconsultorias.com.co/health", "Cada 5 minutos" },
                new[] { "https://geodatabase.mcconsultorias.com.co/api/zonas", "Cada 15 minutos" },
            }
        );

        H1(body, "18. Actualización del código (workflow)");
        Code(body, "# === Backend (en el VPS) ===\ncd /opt/geodatabase\ngit pull origin main\ndocker compose -f docker-compose.vps.yml build backend\ndocker compose -f docker-compose.vps.yml up -d backend\n\n# === Frontend (Netlify, automático) ===\n# Solo hacer git push a main. Netlify detecta el cambio y redespliega.\ncd /local/geovisor-luruaco\ngit add . && git commit -m \"feat: ...\"\ngit push origin main\n# Netlify redesplega automáticamente en 1-3 min.");

        body.Append(PageBreak());

        // ════════ CHEAT SHEET ════════
        H1(body, "19. Resumen de comandos críticos (cheat sheet)");
        Code(body, "# === DESPLEGAR POR PRIMERA VEZ ===\nssh root@srv1668992.hstgr.cloud\napt update && apt install -y docker.io docker-compose-v2 git\nmkdir -p /opt/geodatabase && cd /opt/geodatabase\ngit clone https://github.com/<user>/geovisor-luruaco.git .\nnano .env   # configurar secretos\ndocker compose -f docker-compose.vps.yml up -d --build\nfor f in 04-base-de-datos/0*.sql; do\n  docker exec -i geodb-postgis psql -U eco_admin -d restauracion_ecologica < \"$f\"\ndone\n\n# === VERIFICAR ===\ncurl -s https://geodatabase.mcconsultorias.com.co/health\ndocker compose -f docker-compose.vps.yml ps\n\n# === ACTUALIZAR BACKEND ===\ncd /opt/geodatabase && git pull\ndocker compose -f docker-compose.vps.yml up -d --build backend\n\n# === BACKUP ===\ndocker exec geodb-postgis pg_dump -U eco_admin restauracion_ecologica \\\n  | gzip > /opt/backups/db-$(date +%Y%m%d).sql.gz");

        body.Append(PageBreak());

        // ════════ DATOS PARA DELEGAR ════════
        H1(body, "20. Datos que necesito para hacer el deploy yo mismo");
        Para(body, "Si quieres que yo haga el deploy por ti, necesito:");
        ModernTable(body,
            new[] { "Dato", "Para qué", "Cómo obtenerlo" },
            new[] {
                new[] { "NETLIFY_AUTH_TOKEN", "Personal Access Token para autenticar el CLI", "https://app.netlify.com/user/applications#personal-access-tokens → New access token" },
                new[] { "NETLIFY_SITE_ID", "UUID del sitio de Netlify", "Site settings → General → Site details → Site ID" },
                new[] { "Acceso SSH al VPS (opcional)", "Ejecutar docker compose y migraciones", "ssh root@srv1668992.hstgr.cloud (usuario y puerto SSH)" },
            }
        );
        Para(body, "Lo que NO necesito:", bold: true);
        BulletList(body, new[] {
            "Contraseña de hPanel de Hostinger.",
            "Acceso al panel DNS.",
            "Credenciales de la base de datos.",
        });

        Note(body, "Procedimiento recomendado",
            "1. Tú despliegas el backend en Hostinger (Parte I) — son ~30 minutos siguiendo los pasos. " +
            "2. Yo despliego el frontend en Netlify desde tu Mac con el netlify-cli (Parte II simplificada) — " +
            "son ~5 minutos con los tokens.");

        Para(body, " ");
        Para(body,
            "Documento generado el 2 de julio de 2026 — versión 1.0. Backend en Hostinger + " +
            "Frontend en Netlify bajo el dominio geodatabase.mcconsultorias.com.co.",
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

    private static void SuccessNote(Body body, string text)
    {
        var note = new Table();
        note.Append(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = SuccessBorder },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = SuccessBorder },
                new LeftBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = SuccessBorder },
                new RightBorder { Val = BorderValues.Single, Size = 8, Space = 0, Color = SuccessBorder },
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
                    new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = SuccessFill }
                ),
                new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                    new Run(new RunProperties(new Bold(), new Color { Val = "166534" }), new Text($"✓ {text}"))
                )
            )
        ));
        body.Append(note);
    }

    private static void PartDivider(Body body, string title)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "240", After = "120" },
                new ParagraphBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 16, Space = 4, Color = Navy },
                    new BottomBorder { Val = BorderValues.Single, Size = 16, Space = 4, Color = Navy }
                )
            ),
            new Run(
                new RunProperties(
                    new FontSize { Val = "32" },
                    new Color { Val = "FFFFFF" },
                    new Bold(),
                    new Spacing { Val = 60 }
                ),
                new Text(title) { Space = SpaceProcessingModeValues.Preserve }
            )
        ));
    }

    private static void Code(Body body, string code)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = CodeFill },
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

    private static void DiagramBlock(Body body, string ascii)
    {
        // Use a monospace font for the ASCII diagram
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Shading { Val = ShadingPatternValues.Clear, Color = "auto", Fill = CodeFill },
                new Indentation { Left = "120", Right = "120" },
                new SpacingBetweenLines { After = "120" }
            ),
            new Run(
                new RunProperties(
                    new RunFonts { Ascii = "Consolas", HighAnsi = "Consolas" },
                    new FontSize { Val = "16" }
                ),
                new Text(ascii) { Space = SpaceProcessingModeValues.Preserve }
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
                new Text("Guía Completa de Despliegue")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { Before = "120", After = "240" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "28" }, new Color { Val = Teal }, new Italic()),
                new Text("Backend en Hostinger + Frontend en Netlify")
            )
        ));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "360" },
                new Justification { Val = JustificationValues.Center }
            ),
            new Run(
                new RunProperties(new FontSize { Val = "22" }, new Color { Val = SoftBlack }),
                new Text("Contrato UTL:001 · Geodatabase Luruaco · v1.0")
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
            ("Documento", "Guía completa de despliegue v1.0"),
            ("Contrato", "UTL:001 — Unión Temporal Restauración Luruaco"),
            ("Backend + BD", "Hostinger VPS (srv1668992.hstgr.cloud)"),
            ("Frontend", "Netlify (CDN global)"),
            ("Dominio", "geodatabase.mcconsultorias.com.co"),
            ("Stack", "Go 1.22 + Fiber · React 19 + Vite · PostgreSQL 15 + PostGIS 3.4"),
            ("Tiempo estimado total", "~45 minutos (después de habilitar el backend)"),
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
