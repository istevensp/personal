# Changelog

Registro de cambios notables, derivado únicamente del historial de git
(`git log`) y del código actual. Todos los commits a la fecha están
concentrados en un solo día (2026-07-25); donde el mensaje de commit es
genérico ("fix", "fix build"), la descripción de abajo se basa en el
contenido real del diff y no debe tomarse como una fecha de evento distinta
a la del commit.

## [Unreleased]

### Added
- Set completo de íconos agregado a `public/`: `favicon-16x16.png`,
  `favicon-32x32.png`, `favicon-48x48.png`, `favicon-64x64.png`,
  `favicon-128x128.png`, `apple-touch-icon.png` (180×180), `icon.png`
  (1826×1826, usado como imagen OG/social por defecto).

### Fixed
- Referencias rotas a favicons y al manifest, en dos rondas: primero
  `BaseLayout.astro`/`site.webmanifest` apuntaban a un set de íconos que ya
  no existía; luego, al agregarse el set completo actual, se actualizaron
  ambos archivos para usar los nuevos PNGs con atributos `sizes` explícitos
  (verificados contra las dimensiones reales de cada PNG) y `icon.png` como
  imagen OG por defecto. `public/favicon.ico`, `favicon.png` y
  `android-chrome-512x512.png` fueron eliminados por quedar obsoletos.
  **Pendiente de commit.**

## 2026-07-25

### Added
- Proyecto completo construido desde cero: Astro 5 + React 19 + Tailwind 3,
  Content Collections con Zod, ~16 páginas, ~15 componentes (`924543c add
  full project`).
- Nuevo componente `PublicationsTimeline.astro` en Home, reemplazando
  `FeaturedPublications.astro` (eliminado), tras varias rondas de iteración
  de diseño (`fc552c1 update publications`).
- Nuevo helper compartido `src/lib/publications.ts`
  (`formatMonthYear()`, `primaryExternalLink()`).
- `public/.assetsignore` para excluir `_worker.js` del upload de assets
  públicos de Cloudflare.

### Changed
- Datos reales de publicaciones corregidos con citas IEEE completas: 4
  publicaciones ya publicadas y 5 aceptadas, con abstracts, autores,
  keywords y DOIs verificados (`fc552c1 update publications`).
- Un paper aceptado movido de "aceptado sin mes" a mes confirmado
  (septiembre 2026); dos papers nuevos agregados a `accepted.yaml`
  (ISC2 2026, octubre 2026). Requirió cambiar el schema de `month` a
  `nullable`.
- Header rediseñado: logo pasó de texto+ícono a un monograma animado
  ("SISP") con tooltip "Home"; ítem de nav "Home" eliminado por redundante
  (`d2b6a8f update home`).
- Orden de navegación actualizado: "News" movido después de "Publications";
  resaltado de color quitado de los ítems de nav (tratado por separado del
  commit `d2b6a8f`, ver `docs/DECISIONS.md` DEC-006).
- Página `/contact` rediseñada con animaciones (foto flotante, emoji de
  saludo, íconos animados) y sección CV embebida en `#cv`
  (`354dda2 update contact me`).
- `/cv` convertido en redirect 301 a `/contact#cv` (ver `docs/DECISIONS.md`
  DEC-009).
- Auditoría y corrección de accesibilidad táctil (mínimo 44×44px) en todo
  el sitio (`525710e mobil fix`).
- Set de favicons actualizado varias veces (`c4903ce`, `ecc6845`,
  `83c9a81`, `623de84`, `866d623 icon change 2`) — la última reducción del
  set dejó referencias rotas en el código, corregidas por separado (ver
  sección `[Unreleased]`).
- `README.md` editado para remover contenido específico del proceso de
  construcción con Claude Code (`8dd1de1 update rdm`).

### Fixed
- Deploy fallaba con `Wildcard operators (*) are not allowed in Custom
  Domains` — `wrangler.toml` corregido a un `pattern` sin `/*` ni
  `zone_name` (`7b2db46 fix deploy`, ver `docs/DECISIONS.md` DEC-002).
- Deploy fallaba con `Uploading a Pages _worker.js directory as an asset` —
  corregido con `public/.assetsignore` (ver DEC-003).
- Cero páginas prerenderizadas / Pagefind sin índice — agregado
  `export const prerender = true` a todas las páginas y `getStaticPaths()`
  a las rutas `[slug]` (`2e638e1 fix build`, ver DEC-001).
- `Uncaught ReferenceError: MessageChannel is not defined` en runtime de
  Cloudflare Workers — alias de Vite `react-dom/server` →
  `react-dom/server.edge` en producción (`f5a0da1 MessageChannel`, ver
  DEC-004).
- Tailwind Preflight sobrescribía el `font-weight` de `h1`/`h2` por no
  estar las reglas dentro de `@layer base` (`fd8de30 fix`).
- "Historical Teaching Record" contaba mal semestres vs. paralelos —
  separado el cálculo de `distinctSemesters` de `records.length`.

## Initial commit — 2026-07-25

- `4b61374 Initial commit` — inicialización del repositorio.

---

Para el detalle narrativo completo de cada corrección (mensajes de error
exactos, comandos de verificación usados), ver `DOCUMENTATION.md` §10 y
`docs/DECISIONS.md`.
