# 🎯 Steven Santillán Padilla - Personal Website

**URL:** https://stevensantillan.com  
**Repositorio:** https://github.com/istevensp/personal  
**Licencia:** MIT  
**Estado:** En producción (Astro 5 + React + Tailwind + Cloudflare Workers)

---

# 📋 TABLA DE CONTENIDOS

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación y Setup](#instalación-y-setup)
5. [Comandos Disponibles](#comandos-disponibles)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [GitHub + Cloudflare Setup](#github--cloudflare-setup)
8. [Despliegue a Producción](#despliegue-a-producción)
9. [Configuración de Contenido](#configuración-de-contenido)
10. [SEO y Búsqueda](#seo-y-búsqueda)
11. [Guía de Contribuciones](#guía-de-contribuciones)
12. [Troubleshooting](#troubleshooting)
13. [Licencia y Contacto](#licencia-y-contacto)

---

# 📖 DESCRIPCIÓN DEL PROYECTO

Sitio web personal académico y profesional para **Steven Santillán Padilla**, Lecturer-Researcher en ESPOL especializado en sistemas distribuidos y computación en la nube.

## Propósito

- **Portfolio académico:** Publicaciones, investigación, enseñanza
- **Portfolio profesional:** Experiencia laboral, proyectos, impacto
- **Contacto:** Email directo y LinkedIn

## Características Principales

- ✅ Bilingüe (EN/ES) con selector de idioma
- ✅ Dark/Light mode (automático + manual)
- ✅ Búsqueda global con Pagefind
- ✅ Historico completo de cursos + evaluaciones de desempeño
- ✅ Proyectos de investigación y comunitarios
- ✅ Publicaciones con filtro por estado
- ✅ Experiencia académica + profesional + tutoría de tesis
- ✅ Noticias cronológicas filtrables
- ✅ CVs descargables (Industry + Academic)
- ✅ Optimizado para SEO
- ✅ Responsive (móvil, tablet, desktop)

---

# 🛠️ STACK TECNOLÓGICO

## Frontend

| Herramienta | Versión | Propósito |
|-----------|---------|----------|
| **Astro** | 5.x | Framework SSR/SSG |
| **React** | 19.x | Componentes interactivos (islands) |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Styling utility-first |
| **MDX** | 3.x | Markdown con componentes |

## Deployment

| Servicio | Propósito |
|----------|----------|
| **Cloudflare Workers** | Hosting edge |
| **GitHub Actions** | CI/CD automático |
| **Cloudflare Pages** | (Futuro) |

## Content & Search

| Herramienta | Propósito |
|-----------|----------|
| **YAML** | Datos estructurados |
| **MDX** | Proyectos, noticias, artículos |
| **Pagefind** | Búsqueda estática offline |

## Desarrollo

| Herramienta | Propósito |
|-----------|----------|
| **Node.js** | v20 LTS o superior |
| **npm** | Package manager |
| **Wrangler** | CLI Cloudflare Workers |

---

# 📋 REQUISITOS PREVIOS

### Sistema

- **Node.js:** v20 LTS o superior (verificar: `node --version`)
- **npm:** 10.x o superior (verificar: `npm --version`)
- **Git:** Instalado y configurado
- **Windows/Mac/Linux:** Cualquiera funciona

### Cuentas y Permisos

- ✅ GitHub cuenta (repo https://github.com/istevensp/personal)
- ✅ Cloudflare account (dominio + Workers)
- ✅ Secrets en GitHub Actions configurados:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`

---

# 🚀 INSTALACIÓN Y SETUP

## Paso 1: Clonar Repositorio

```bash
git clone https://github.com/istevensp/personal.git
cd personal
```

## Paso 2: Instalar Dependencias

```bash
npm install
```

## Paso 3: Variables de Entorno

Crear archivo `.env` en raíz (copiar de `.env.example`):

```bash
cp .env.example .env
```

Completar con tus valores:

```
CLOUDFLARE_ACCOUNT_ID=tu_account_id
CLOUDFLARE_API_TOKEN=tu_api_token
```

## Paso 4: Verificar Instalación

```bash
npm run dev
```

Debe abrir: `http://localhost:4321`

---

# 📦 COMANDOS DISPONIBLES

```bash
# Desarrollo
npm run dev                 # Inicia servidor dev (http://localhost:4321)

# Build
npm run build              # Build para producción (Cloudflare Workers)

# Búsqueda
npm run search:build       # Construye índice Pagefind para búsqueda

# Preview
npm run preview            # Previewea build localmente

# Deploy
npm run deploy             # Build + Deploy a Cloudflare Workers

# Lint (opcional)
npm run lint               # ESLint check
```

---

# 📁 ESTRUCTURA DEL PROYECTO

```
personal/
│
├── .github/
│   └── workflows/
│       └── deploy.yml                    # CI/CD: GitHub Actions → Cloudflare
│
├── src/
│   ├── content/
│   │   ├── config.ts                     # Content Collections + Zod schemas
│   │   ├── profile/                      # Datos personales
│   │   │   ├── personal.yaml
│   │   │   ├── education.yaml
│   │   │   ├── certifications.yaml
│   │   │   ├── interests.yaml
│   │   │   └── awards-honors.yaml
│   │   ├── experience/                   # Experiencia laboral
│   │   │   ├── academic.yaml
│   │   │   ├── professional.yaml
│   │   │   └── thesis-advisory.yaml
│   │   ├── teaching/                     # Cursos e histórico
│   │   │   └── courses.yaml
│   │   ├── maps/                         # Mapeos dinámicos
│   │   │   └── evaluaciones.yaml         # 55 evaluaciones de SAAC
│   │   ├── projects/                     # Proyectos (investigación + comunitarios)
│   │   │   ├── research/
│   │   │   │   ├── 2026-active-learning-*.mdx
│   │   │   │   ├── 2025-next-generation-*.mdx
│   │   │   │   ├── 2023-iot-*.mdx
│   │   │   │   └── 2021-data-center-*.mdx
│   │   │   └── community/
│   │   │       ├── 2025-schooling-*.mdx
│   │   │       ├── 2024-energy-*.mdx
│   │   │       ├── 2023-coastal-*.mdx
│   │   │       ├── 2022-*.mdx
│   │   │       ├── 2021-*.mdx
│   │   │       └── _drafts/2022-la-union-*.mdx
│   │   ├── publications/                 # Papers
│   │   │   ├── published.yaml
│   │   │   ├── accepted.yaml
│   │   │   └── under-review.yaml
│   │   └── news/                         # Noticias cronológicas
│   │       ├── 2026-01-15-*.mdx
│   │       ├── 2025-12-20-*.mdx
│   │       └── ...más
│   │
│   ├── pages/                            # Rutas públicas
│   │   ├── index.astro                   # Home
│   │   ├── about.astro                   # About
│   │   ├── teaching/index.astro          # Teaching
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   ├── research/[slug].astro
│   │   │   └── community/[slug].astro
│   │   ├── publications/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── experience/
│   │   │   ├── index.astro
│   │   │   ├── academic.astro
│   │   │   └── professional.astro
│   │   ├── news/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── cv.astro                      # Redirect a /contact#cv
│   │   ├── contact.astro                 # Contact (incluye descarga de CV)
│   │   └── 404.astro                     # Error page
│   │
│   ├── components/                       # Componentes reutilizables
│   │   ├── Layout/
│   │   │   ├── BaseLayout.astro
│   │   │   ├── Header.astro
│   │   │   ├── Navigation.astro
│   │   │   └── Footer.astro
│   │   ├── Home/
│   │   │   ├── HeroSection.astro
│   │   │   ├── FeaturedProjects.astro
│   │   │   ├── FeaturedPublications.astro
│   │   │   ├── FeaturedAwards.astro
│   │   │   ├── RecentNews.astro
│   │   │   └── ContactCTA.astro
│   │   ├── Cards/
│   │   │   ├── ProjectCard.astro
│   │   │   ├── PublicationCard.astro
│   │   │   ├── NewsCard.astro
│   │   │   ├── ExperienceCard.astro
│   │   │   └── CourseCard.astro
│   │   └── Common/
│   │       ├── SearchBar.jsx             # React: Pagefind
│   │       ├── NewsFilter.jsx            # React: Filtro por categoría
│   │       ├── ThemeToggle.jsx           # React: Dark/light
│   │       └── LanguageSwitcher.jsx      # React: EN/ES
│   │
│   └── styles/
│       ├── globals.css
│       ├── components.css
│       └── tailwind.css
│
├── public/
│   ├── robots.txt                        # SEO
│   ├── favicon.ico, favicon.svg, favicon-16x16.png, favicon-32x32.png
│   ├── apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png
│   ├── site.webmanifest
│   └── images/
│       └── profile.jpg
│
├── docs/                                 # PDFs de CVs (estáticos, agregados manualmente)
│   ├── cv-industry.pdf
│   └── cv-academic.pdf
│
├── .github/workflows/deploy.yml          # CI/CD
├── .env.example                          # Variables de entorno (template)
├── .env                                  # Variables de entorno (local, .gitignore)
├── .gitignore
├── astro.config.mjs                      # Config Astro 5
├── wrangler.toml                         # Config Cloudflare Workers
├── tailwind.config.mjs                   # Config Tailwind CSS
├── tsconfig.json                         # TypeScript config
├── package.json                          # Dependencies + scripts
├── package-lock.json
├── README.md                             # Este archivo
├── DOCUMENTATION.md                      # Referencia técnica detallada del proyecto
├── LICENSE                               # MIT License
└── manifest.yaml                         # Índice de contenido inicial
```

---

# 🔗 GITHUB + CLOUDFLARE SETUP

## Paso 1: Configurar GitHub Secrets

**Ubicación:** https://github.com/istevensp/personal/settings/secrets/actions

### Secret 1: CLOUDFLARE_API_TOKEN

```
Name: CLOUDFLARE_API_TOKEN
Value: (obtenido en https://dash.cloudflare.com/profile/api-tokens)
```

**Cómo obtenerlo:**
1. Ve a: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Template: "Edit Cloudflare Workers"
4. Copia el token
5. Pégalo en GitHub Secret

### Secret 2: CLOUDFLARE_ACCOUNT_ID

```
Name: CLOUDFLARE_ACCOUNT_ID
Value: (obtenido en https://dash.cloudflare.com/)
```

**Cómo obtenerlo:**
1. Ve a: https://dash.cloudflare.com/
2. Sidebar derecho: "Account ID"
3. Copia el ID
4. Pégalo en GitHub Secret

## Paso 2: Verificar Secrets

- Ve a: https://github.com/istevensp/personal/settings/secrets/actions
- Deben estar ambos secrets listados (sin ver los valores)

## Paso 3: Configurar Cloudflare Domain

1. El dominio `stevensantillan.com` debe existir como **zona activa** en tu cuenta de Cloudflare (Domains → verificar estado "Active").
2. El binding del dominio al Worker se define en `wrangler.toml` como **Custom Domain** (`pattern = "stevensantillan.com"`, `custom_domain = true`) — no como "Route" con wildcard, ya que los Custom Domains de Cloudflare no aceptan `/*` ni paths.
3. Se aplica automáticamente en cada `wrangler deploy` (vía GitHub Actions); no requiere pasos manuales adicionales en el dashboard.

---

# 🚀 DESPLIEGUE A PRODUCCIÓN

## Flujo Automático (Recomendado)

```bash
# 1. Haz cambios locales
git add .
git commit -m "Descripción de cambios"

# 2. Push a GitHub
git push origin main

# 3. GitHub Actions se ejecuta automáticamente
# - Build: npm run build
# - Deploy: Cloudflare Workers
# - Sitio en vivo: https://stevensantillan.com
```

**Tiempo total:** ~5-10 minutos desde push hasta live

## Flujo Manual (Si necesitas probar antes)

```bash
# 1. Build local
npm run build

# 2. Preview
npm run preview

# 3. Si todo está bien, deploy
npm run deploy

# 4. Verifica en https://stevensantillan.com
```

## Troubleshooting Despliegue

| Problema | Solución |
|----------|----------|
| "No CLOUDFLARE_API_TOKEN secret" | Verificar GitHub Secrets están correctos |
| Build error | `npm run build` local para ver error exacto |
| Sitio 404 | Verificar dominio en Cloudflare routing |
| Estilos no cargan | Ejecutar `npm run build` nuevamente |

---

# ⚙️ CONFIGURACIÓN DE CONTENIDO

## Agregar Nuevo Proyecto

### 1. Crear archivo MDX

Ubicación: `src/content/projects/research/` o `community/`

```markdown
---
title: "Nombre del Proyecto"
date: 2026-01-15
featured: true  # Para mostrar en Home
slug: nombre-del-proyecto
type: research  # o community
---

## Descripción

Contenido del proyecto en markdown...
```

### 2. Se indexa automáticamente

- Aparece en `/projects`
- Si `featured: true`, aparece en Home (top 3)

---

## Agregar Nueva Noticia

### 1. Crear archivo MDX

Ubicación: `src/content/news/`

```markdown
---
title: "Título de la Noticia"
date: 2026-01-15
category: Publications  # Research, Publications, Conferences, Teaching, Awards, Professional
slug: titulo-noticia
featured: true
---

Contenido de la noticia...
```

### 2. Se indexa automáticamente

- Aparece en `/news` (cronológico)
- Filtrable por categoría
- Si es reciente (últimas 4), aparece en Home

---

## Editar YAML (Información Estática)

### Cambiar información personal

Edita: `src/content/profile/personal.yaml`

```yaml
firstName: Steven
email:
  institutional: steisant@espol.edu.ec
```

### Cambiar educación

Edita: `src/content/profile/education.yaml`

### Cambiar experiencia

Edita: `src/content/experience/academic.yaml` o `professional.yaml`

**Nota:** Los cambios se reflejan automáticamente en las páginas.

---

# 🔍 SEO Y BÚSQUEDA

## Búsqueda Global (Pagefind)

- ✅ Automática en todas las páginas
- ✅ Indexa: títulos, descripciones, contenido
- ✅ Offline (funciona sin internet)
- ✅ Build: `npm run search:build`

## Meta Tags

Astro genera automáticamente:
- `og:title`, `og:description`, `og:image`
- `twitter:card`, `twitter:title`
- `canonical` (previene duplicados)

## Sitemap

- ✅ Generado automáticamente: `https://stevensantillan.com/sitemap-index.xml`
- ✅ Robots.txt: `https://stevensantillan.com/robots.txt`
- ✅ Indexable en Google, Bing, etc

## Structured Data (JSON-LD)

- Papers usan `@type: ScholarlyArticle`
- About page usa `@type: Person`
- Ayuda a motores de búsqueda entender el contenido

---

# 📝 GUÍA DE CONTRIBUCIONES

Este es un repositorio PÚBLICO bajo licencia MIT. Las contribuciones son bienvenidas.

## Flujo de Contribución

1. **Fork** el repositorio
2. **Crea rama:** `git checkout -b feature/mi-mejora`
3. **Haz cambios** con commits descriptivos
4. **Push:** `git push origin feature/mi-mejora`
5. **Pull Request** con descripción clara

## Estándares

- TypeScript strict mode
- Componentes pequeños y reutilizables
- Astro + React (no añadir otras librerías sin discutir)
- Tailwind CSS para estilos
- Comentarios en código complejo

---

# 🆘 TROUBLESHOOTING

## "Module not found" error

```bash
npm install
npm run dev
```

## Puerto 4321 ya está en uso

```bash
# Cambiar puerto
npm run dev -- --port 4322
```

## Cambios no se reflejan

```bash
# Limpiar caché
rm -rf .astro dist node_modules
npm install
npm run dev
```

## Build falla localmente

```bash
# Ver error exacto
npm run build -- --verbose
```

## Evaluaciones no cargan

Verificar que `src/content/maps/evaluaciones.yaml` existe y es válido YAML.

## Dark mode no persiste

Verificar `localStorage` está habilitado en navegador.

---

# 📄 LICENCIA Y CONTACTO

## Licencia

Este proyecto está bajo **Licencia MIT**.

Eres libre de:
- ✅ Usar, modificar, distribuir
- ✅ Usar en proyectos comerciales
- ✅ Privado o público

Debes:
- ✅ Incluir copia de la licencia

Ver `LICENSE` para detalles completos.

---

## Contacto

- **Email:** steisant@espol.edu.ec
- **LinkedIn:** https://www.linkedin.com/in/stevensp1803/
- **GitHub:** https://github.com/istevensp
- **ORCID:** https://orcid.org/0000-0001-7759-7747
- **Google Scholar:** https://scholar.google.com/citations?hl=es&user=WL9l7jgAAAAJ

---

## Autor

**Steven Isaac Santillán Padilla**
- Lecturer-Researcher en ESPOL
- Especialista en Sistemas Distribuidos y Computación en la Nube
- Ubicación: Guayaquil, Ecuador

---

# 📚 RECURSOS ADICIONALES

- [Documentación Astro](https://docs.astro.build)
- [Documentación Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Tailwind CSS](https://tailwindcss.com)
- [React](https://react.dev)
- [Pagefind Search](https://pagefind.app)

---

**Última actualización:** 2026-07-25  
**Versión:** 1.0.0  
**Estado:** Production-ready
