# Project Documentation — stevensantillan.com

This file is the technical reference for this repository: what it is, how it is
built, where every piece of content lives, and how to extend it safely. It is
written so that a human developer, or another AI coding agent (Claude, ChatGPT,
etc.) picking this up cold can become productive without re-deriving any of
the decisions below from scratch.

It complements, but does not replace:
- `README.md` — public-facing project overview (setup, commands, structure).
- `manifest.yaml` — original file manifest from the YAML/MDX generation step. Left untouched.
- `docs/PROJECT-STATUS.md` — current snapshot of what's done/in-progress/pending, kept short and meant to go stale fast — this file (`DOCUMENTATION.md`) is the durable technical reference.
- `docs/DECISIONS.md` — architectural decisions in ADR-style records, a more structured complement to §10 below.
- `CHANGELOG.md` — dated log of notable changes, derived only from git history.
- `PROJECT-CONTEXT-HANDOFF.md` — a point-in-time full context dump generated for a chat-to-chat handoff; not meant to be kept in sync, unlike this file.

If this file and the code disagree, the code is the source of truth — update
this file to match rather than the other way around.

---

## 1. What this is

A personal academic/professional site for Steven Santillan Padilla (lecturer
and researcher at ESPOL), built with:

- **Astro 5** — file-based routing, server output (SSR).
- **React 19** — only for interactive "islands" (theme toggle, language
  switcher, search, news filter). Everything else is static Astro markup.
- **Tailwind CSS 3** — utility classes + a small set of hand-written
  component classes (`.btn-primary`, `.card`, `.badge`, …) in
  `src/styles/components.css`.
- **Astro Content Collections** (Content Layer API) — all data-driven content
  (profile, experience, teaching, publications, projects, news) is typed and
  Zod-validated in `src/content/config.ts`.
- **Cloudflare Workers** (`@astrojs/cloudflare`) — deployment target.
- **Pagefind** — static full-text search, built as a post-build step.

Output mode is `server` (`astro.config.mjs`) at the project level, but **every
page currently sets `export const prerender = true`** (with `getStaticPaths()`
on the four `[slug]` routes) — see §10. Nothing on this site needs
per-request logic today, so the whole site builds as static HTML; `output:
'server'` is kept only so a genuinely dynamic route could be added later
without re-plumbing the adapter.

---

## 2. Repository layout

```
personal/
├── .github/workflows/deploy.yml   # CI: build + pagefind + deploy to Cloudflare Workers
├── docs/                          # CV PDFs go here manually (not generated); README.md explains what's expected
├── public/
│   ├── .assetsignore              # Excludes _worker.js from being uploaded as a public asset — see §10
│   ├── favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, favicon-64x64.png, favicon-128x128.png
│   ├── apple-touch-icon.png       # 180x180
│   ├── icon.png                   # 1826x1826 master icon — used as default OG/social image and largest manifest icon
│   ├── site.webmanifest
│   ├── robots.txt
│   └── images/                    # Put profile.jpg here (see §9)
├── src/
│   ├── content/
│   │   ├── config.ts              # Content Collections schemas — see §3
│   │   ├── profile/*.yaml         # personal, education, certifications, interests, awards-honors
│   │   ├── experience/*.yaml      # academic, professional, thesis-advisory
│   │   ├── teaching/courses.yaml
│   │   ├── maps/evaluaciones.yaml # 55 SAAC evaluation records (historical, all courses)
│   │   ├── publications/*.yaml    # published, accepted, under-review
│   │   ├── projects/research/*.mdx
│   │   ├── projects/community/*.mdx (+ _drafts/)
│   │   └── news/*.mdx
│   ├── components/
│   │   ├── Layout/                # BaseLayout, Header, Navigation, Footer
│   │   ├── Home/                  # Hero + featured-content sections for index.astro, incl. PublicationsTimeline
│   │   ├── Cards/                 # Reusable card presentational components
│   │   └── Common/                # React islands: ThemeToggle, LanguageSwitcher, SearchBar, NewsFilter
│   ├── lib/publications.ts        # Shared helpers: formatMonthYear(), primaryExternalLink()
│   ├── i18n/strings.ts            # EN/ES dictionary for chrome-level UI text only
│   ├── pages/                     # File-based routes — see §6
│   └── styles/
│       ├── tailwind.css           # @import order matters — see §8
│       ├── globals.css            # CSS variables (design tokens, light/dark theme)
│       └── components.css         # @layer components — .btn-*, .card, .badge, .link, .prose-content
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── wrangler.toml
└── package.json
```

---

## 3. Content model (`src/content/config.ts`)

### 3.1 Why singleton YAML files use a custom loader

Most of the YAML files under `src/content/` are **not** lists of many small
records — they're one file holding one object (e.g. `education.yaml` is
`{ degrees: [...] }`, `personal.yaml` is a single flat profile object). Astro's
built-in `file()` loader expects either a bare array or an id→object map, which
doesn't fit that shape directly.

To keep each file's natural shape *and* still get Zod validation, `config.ts`
defines a small helper:

```ts
function singleFile(path: string) {
  return file(path, {
    parser: (text) => [{ id: 'data', ...(parse(text) as Record<string, unknown>) }],
  });
}
```

This wraps the whole parsed YAML object into one entry with `id: 'data'`. As a
result, every one of these collections has exactly **one** entry, fetched like:

```ts
const entry = await getEntry('personal', 'data');
entry.data.fullName // etc.
```

Collections built this way: `personal`, `education`, `certifications`,
`interests`, `awardsHonors`, `academicExperience`, `professionalExperience`,
`thesisAdvisory`, `courses`, `evaluaciones`, `publicationsPublished`,
`publicationsAccepted`, `publicationsUnderReview`.

### 3.2 Multi-entry collections (MDX)

`projectsResearch`, `projectsCommunity`, and `news` are normal multi-file
collections using Astro's `glob()` loader — one entry per `.mdx` file. These
are fetched with `getCollection('projectsResearch', filterFn)` and rendered
with `render(entry)` to get a `<Content />` component.

Each entry's routing slug comes from its **frontmatter field**
(`projectId` for projects, `slug` for news), not from the file path. This was
a deliberate choice so that file organization (e.g. the `_drafts/` subfolder
under `projects/community/`) doesn't leak into URLs.

### 3.3 Draft filtering convention

Every MDX collection has a `draft: boolean` field. Every page/component that
lists these collections filters with `({ data }) => !data.draft`. To publish a
draft item, just flip `draft: false` in its frontmatter — no code changes
needed.

### 3.4 Schema reference (field-by-field)

See `src/content/config.ts` directly — it's the single source of truth and is
kept in sync with the actual YAML/MDX shapes on disk. Do not add a field to a
YAML file without also adding it to its Zod schema (the dev server will throw
a content-validation error if they drift, which is the intended safety net).

---

## 4. How to add/edit content

All of these are pure data edits — no component code changes required.

- **New research or community project**: add a new `.mdx` file under
  `src/content/projects/research/` or `.../community/`, following the
  frontmatter shape of an existing file in that folder. Set `featured: true`
  to have it show up in the Home page's "Featured Projects" (top 3, sorted by
  year, non-featured items backfill remaining slots — see
  `src/components/Home/FeaturedProjects.astro`).
- **New publication**: add an entry to the `published` / `accepted` /
  `under-review` array in the matching file under `src/content/publications/`.
  `featured: true` works the same way as projects for `published`/`accepted`
  (`under-review` items never show on Home by design — see Decision 7 in the
  original master doc).
- **New news item**: add a `.mdx` file under `src/content/news/` with
  `title`, `date`, `category`, `slug`, `featured`, `draft`. Leave `draft: true`
  until it's ready to go live.
- **New course / semester evaluation link**: edit
  `src/content/teaching/courses.yaml` (curated "Current Courses" list) and/or
  `src/content/maps/evaluaciones.yaml` (raw SAAC historical export — grouped
  automatically by `courseCode` on the Teaching page, see §4.1).
- **Thesis advisory**: add entries to the `thesisAdvisory` array in
  `src/content/experience/thesis-advisory.yaml` (currently empty).
- **Profile/education/certifications/awards**: edit the corresponding YAML
  file directly under `src/content/profile/` or `src/content/experience/`.

### 4.1 Why "Current Courses" and "Historical Teaching Record" are two separate sections

`src/pages/teaching/index.astro` intentionally does **not** try to merge
`courses.yaml`'s 3 curated courses with the 55 records in
`evaluaciones.yaml`. Their `courseId`/`code` fields don't reliably match
(e.g. "Algorithms" in `courses.yaml` has no corresponding SAAC course code in
the evaluations export — it may map to "Fundamentos de Programación"
(CCPG1043) or may not be in the export at all; this was never confirmed).
Rather than guess, the page shows:

1. **Current Courses** — cards driven by `courses.yaml`, showing whatever
   `semesters` you've filled in there (empty by default).
2. **Historical Teaching Record** — cards derived directly from
   `evaluaciones.yaml`, grouped by `courseCode`, sorted by most recent year,
   filterable by area (`CCPG*` → "Computer Science", `TLMG*` → "Telematics &
   Networks" — see the `areaLabels` map at the top of the page file). This
   surfaces all 55 real evaluation links without fabricating a mapping.

If you later confirm the real `courseId ↔ courseCode` mapping, you can
populate `courses.yaml`'s `semesters` arrays directly and the "Current
Courses" cards will pick it up automatically (`CourseCard.astro` already
renders an accordion of semesters with evaluation links whenever the array is
non-empty).

---

## 5. Components reference

### Layout (`src/components/Layout/`)
- **BaseLayout.astro** — the HTML shell. Owns `<head>` meta tags (OG,
  Twitter, canonical, JSON-LD), the dark-mode/i18n bootstrap `<script>`s, and
  wraps every page in `<Header />` + `<main><slot /></main>` + `<Footer />`.
  Props: `title`, `description`, `image?`, `type?`, `publishedDate?`,
  `jsonLd?`.
- **Header.astro** — sticky top bar: an icon-only animated logo (an
  `animate-float` monogram derived from `personal.fullName`'s initials,
  currently rendering "SISP", with a custom CSS tooltip reading "Home" on
  hover/focus — no text name is shown next to it), `<Navigation />`, and the
  three React islands (`SearchBar`, `LanguageSwitcher`, `ThemeToggle`), all
  `client:load`. There is deliberately **no separate "Home" nav item** — the
  logo is the sole way back to `/`, since a dedicated Home button was found
  to be redundant with it.
- **Navigation.astro** — desktop inline nav + a mobile slide-down menu driven
  by a small vanilla `<script>` (no React needed for a pure show/hide toggle).
  Current `navItems` order: About, Teaching, Experience, Projects,
  Publications, News, Contact Me.
- **Footer.astro** — social links row (GitHub, LinkedIn, Google Scholar,
  ResearchGate, ORCID — all icon-only buttons; the ORCID icon uses the
  official brand mark, `public/images/ORCID_iD.svg` (green circle + "iD"),
  loaded via `<img>` rather than inlined as a `currentColor` SVG path like
  the others) + copyright line.

### Home (`src/components/Home/`)
Each is a self-contained `<section>` used only by `src/pages/index.astro`, in
this order: `HeroSection` → `PublicationsTimeline` → `FeaturedProjects` →
`FeaturedAwards` → `RecentNews` → `ContactCTA`. All fetch their own content via
`astro:content` — no props passed from the page.

`PublicationsTimeline.astro` replaced an earlier `FeaturedPublications.astro`
(now deleted) after 3 rounds of design iteration. It renders a horizontal,
newest-first row of the 6 most recent publications (across all statuses,
sorted by a `sortKey` combining year+month), each as a `w-48` column with a
status-colored dot, date + status label, `line-clamp-2` title, and
`line-clamp-1` venue, connected by fixed-width line segments and wrapped in
an `overflow-x-auto` container for mobile. Status-dot colors: `Published` →
`bg-success`, `Accepted` → `bg-warning`, `Under Review` → `bg-gray-400`. Uses
the shared `formatMonthYear()`/sorting helpers pattern also used by
`src/lib/publications.ts`.

`HeroSection.astro` also renders the profile photo box (see §9) and the
social-links row (email, GitHub, Google Scholar, LinkedIn, ResearchGate,
ORCID) directly under the bio.

### Cards (`src/components/Cards/`)
Pure presentational `.astro` components, each taking plain props (no direct
content-collection access) so they can be reused across Home, index pages, and
detail pages: `ProjectCard`, `PublicationCard`, `NewsCard`, `ExperienceCard`,
`CourseCard` (the only one with built-in interactivity — a native
`<details>/<summary>` accordion for semester evaluation links, no JS needed).

### Common (`src/components/Common/`) — React islands
- **ThemeToggle.jsx** — reads/writes `localStorage.theme`, toggles the
  `.dark`/`.light` class on `<html>`. A blocking inline script in
  `BaseLayout.astro` applies the stored theme *before* paint to avoid a flash.
- **LanguageSwitcher.jsx** — EN/ES buttons. Writes `localStorage.lang`, sets
  `document.documentElement.lang`, and dispatches a `languagechange`
  `CustomEvent`. See §7 for what it actually translates.
- **SearchBar.jsx** — a `Cmd/Ctrl+K` modal that dynamically imports
  `/pagefind/pagefind.js` at runtime (only exists after `npm run
  search:build`; gracefully shows an "unavailable" message otherwise — see
  §8).
- **NewsFilter.jsx** — category filter buttons for `/news`. Deliberately does
  **not** hold the news data itself; it toggles `.hidden` on sibling DOM nodes
  tagged `data-category="…"` inside a container `id` passed as a prop. This
  keeps `NewsCard` rendering in plain Astro instead of duplicating it in JSX.

The Publications-page status filter and the Teaching-page area filter use the
same "toggle `.hidden` via `data-*` attributes" pattern but as inline
`<script>` tags directly in those page files, rather than a React component —
there was no dedicated component in the original spec for those, and a full
React island isn't needed for what is, functionally, a set of button clicks
toggling CSS classes.

---

## 6. Pages / routing

| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Home; Person JSON-LD |
| `/about` | `src/pages/about.astro` | Education, interests, certifications, awards |
| `/teaching` | `src/pages/teaching/index.astro` | See §4.1 |
| `/projects` | `src/pages/projects/index.astro` | Research + Community grids |
| `/projects/research/[slug]` | `.../research/[slug].astro` | `slug` = MDX frontmatter `projectId` |
| `/projects/community/[slug]` | `.../community/[slug].astro` | same |
| `/publications` | `src/pages/publications/index.astro` | Client-side status filter |
| `/publications/[slug]` | `.../publications/[slug].astro` | `slug` = YAML `id`; ScholarlyArticle JSON-LD |
| `/experience` | `src/pages/experience/index.astro` | Academic/Professional tabs |
| `/experience/academic` | `.../academic.astro` | + Thesis Advisory |
| `/experience/professional` | `.../professional.astro` | |
| `/news` | `src/pages/news/index.astro` | `NewsFilter` island |
| `/news/[slug]` | `.../news/[slug].astro` | `slug` = MDX frontmatter `slug` |
| `/contact` | `src/pages/contact.astro` | mailto + LinkedIn + embedded "CV & Resume" section (`#cv`), no form |
| `/cv` | `src/pages/cv.astro` | 301 redirect to `/contact#cv` (kept so old links/bookmarks still resolve) |
| `/404` | `src/pages/404.astro` | Astro's default 404 handler |

Every route above sets `export const prerender = true` and the four `[slug]`
routes implement `getStaticPaths()`, so the whole site is generated as static
HTML at build time (see §10) — none of it renders per-request despite the
project-level `output: 'server'` setting. Unmatched slugs are handled inside
`getStaticPaths()`/the page body, rendering an inline "not found" block
(same layout) rather than a true runtime 404 lookup.

---

## 7. i18n — what is and isn't translated

`src/i18n/strings.ts` holds an EN/ES dictionary for **chrome-level UI text
only**: nav labels, a handful of button/label strings (see the file for the
full key list). Elements carrying that text are tagged `data-i18n="key"`.

A `<script>` in `BaseLayout.astro` (not React — needs to run on every full
page load, including SSR navigations) reads `localStorage.lang` on load and
whenever `LanguageSwitcher` fires `languagechange`, then walks
`document.querySelectorAll('[data-i18n]')` and swaps `textContent`.

**This does not translate any data-driven content** — bios, course
descriptions, publication abstracts, project write-ups, news bodies. All of
that exists only in English in the source YAML/MDX. If full content
translation is ever wanted, it needs either per-language content files or a
translation field per entry plus schema changes in `config.ts` — that is a
content/schema project, not a quick code change.

---

## 8. Search (Pagefind)

Pagefind indexes the **built** site, not the dev server. Workflow:

```bash
npm run build          # astro build → dist/
npm run search:build   # pagefind --site dist/client → generates dist/client/pagefind/*
```

`SearchBar.jsx` tries to `import('/pagefind/pagefind.js')` at runtime; in dev
(`npm run dev`) or before the search:build step has ever run, that import
fails and the UI shows "Search index is only available on the deployed/built
site" instead of crashing. The import path is assembled from an array +
`.join('/')` specifically so bundlers don't try to statically resolve a file
that doesn't exist yet at build time (see the comment in the file if this
trips up a future refactor).

The GitHub Actions workflow (`.github/workflows/deploy.yml`) always runs both
steps before deploying, so production search works as long as CI runs.

---

## 9. Known placeholders / things the site owner still needs to provide

None of these were invented — they're left as explicit gaps rather than
fabricated content:

- **Favicon set**: `public/` now has a full PNG icon set —
  `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`,
  `favicon-64x64.png`, `favicon-128x128.png`, `apple-touch-icon.png`
  (180×180), and `icon.png` (a 1826×1826 master image used as the default
  Open Graph/social-share image and as the largest `site.webmanifest` icon).
  `BaseLayout.astro`'s `<head>` block declares each PNG icon with an explicit
  `sizes` attribute (verified against each file's real PNG `IHDR` dimensions,
  not just its filename). This set went through two prior states worth
  knowing about if a future `git blame` looks confusing: it started as a
  larger set (`favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png`, `android-chrome-192x192.png`), was reduced to just
  `favicon.ico`/`favicon.png`/`android-chrome-512x512.png` (which briefly
  broke the site because the code still referenced the old files), and was
  then replaced with the current PNG-only set described above — there is no
  `favicon.ico` anymore, which is fine since every browser that matters
  supports PNG `<link rel="icon">` with explicit sizes.
- **Profile photo**: drop a file at `public/images/profile.jpg`. The Hero
  photo box (`HeroSection.astro`) already points at that path; if it 404s,
  an `onerror` handler hides the broken `<img>` and reveals a gradient +
  initials placeholder underneath — so an empty state never looks broken.
- **CV PDFs**: `docs/cv-industry.pdf` and `docs/cv-academic.pdf` (see
  `docs/README.md`). The "CV & Resume" section on `/contact` already links to
  their GitHub raw URLs.
- **`src/content/experience/thesis-advisory.yaml`** — empty array, schema
  ready (`studentName`, `thesisTitle`, `year`, `institution`,
  `role: Advisor|Co-Advisor`, `status: completed|in-progress`).
- **Every `[PROPORCIONAR]` string** inside the project MDX files
  (`problem`, `myContribution`, `methodology`, etc.) and publication YAML
  (`abstract`, `doi`, author lists, resource links). These render as literal
  `[PROPORCIONAR]` text on the live site until filled in — grep for it before
  going live: `grep -rn "PROPORCIONAR" src/content`.
- **`src/content/news/*.mdx`** — only two seed entries exist, both
  `draft: true`, built from facts already confirmed elsewhere in the content
  (a paper acceptance and a paper publication) purely to exercise the news
  pipeline. Write real news and flip `draft: false` to publish.
- **GitHub Actions secrets**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  must be set in the repo's GitHub settings before pushes to `main` will
  deploy successfully.
- **`wrangler.toml`**: `account_id` is intentionally omitted (see the comment
  in the file) — set via `CLOUDFLARE_ACCOUNT_ID` env/secret, never committed.
  The custom domain route assumes `stevensantillan.com` is already an
  **Active** zone in that same Cloudflare account (verified 2026-07-25).

---

## 10. Deviations from the original master document

The original planning doc (`DOCUMENTO-MAESTRO-CLAUDE-CODE_FINAL.md`, not part
of this repo) specified some exact package versions and config shapes that
turned out to be mutually incompatible with Astro 5 as actually published.
These were corrected during the build; documented here so nobody "fixes" them
back to the original spec by mistake:

- `@astrojs/mdx` → `^4.0.0` (the doc said `^3.0.0`, which peer-depends on
  Astro 4, not 5).
- `@astrojs/cloudflare` → `^12.0.0` (doc said `^11.0.0`; v11 also peer-depends
  on Astro 4).
- `tailwindcss` → `^3.4.0`, not `^4.0.0`. `@astrojs/tailwind` (the classic
  integration, which the doc's `astro.config.mjs` uses, and which reads
  `tailwind.config.mjs`) only supports Tailwind v3. Tailwind v4 uses a
  different Vite-plugin-based integration and CSS-first config; mixing the
  two as originally specified would not build.
- `wrangler.toml` — rewritten for the modern Workers **Assets** format
  (`[assets]` binding + `main` pointing at the built worker entry). The
  original doc's `type = "javascript"` + `mode = "directory"` adapter option
  are from an older, now-unsupported Wrangler/adapter generation.
- `wrangler.toml` route — **Custom Domains do not accept a path/wildcard.**
  The first deploy failed with `Wildcard operators (*) are not allowed in
  Custom Domains` / `Paths are not allowed in Custom Domains` because the
  route was `pattern = "stevensantillan.com/*"` with `zone_name` set. Fixed
  to a bare-hostname pattern (`pattern = "stevensantillan.com"`,
  `custom_domain = true`, no `zone_name`, no `/*`). Verified with
  `npx wrangler deploy --dry-run` before pushing again.
- `wrangler.toml` also had a `[build]` section (`command = "npm run build"`),
  which made `wrangler deploy` silently re-run the entire Astro build a
  second time on top of the one the GitHub Actions workflow already runs
  explicitly. Removed — harmless but pure wasted CI time.
- **All pages needed `export const prerender = true`** (plus
  `getStaticPaths()` on the four `[slug]` routes). With `output: 'server'`
  and nothing prerendered, `astro build` produced **zero** `.html` files —
  everything would have rendered per-request instead. That's what actually
  broke Pagefind (see the `search:build` fix below), and it also means the
  original `output: 'server'` choice was doing all downside (a Worker
  invocation per request) for no upside, since nothing on this site needs
  per-request logic. Every page listed in §6 is now static output; `output:
  'server'` is kept at the project level only so a genuinely dynamic route
  could be added later without re-plumbing the adapter.
- `package.json`'s `search:build` script pointed at `pagefind --site
  dist/client` — that directory never existed for this adapter; the actual
  static output root is `dist/` itself (with `dist/_worker.js` holding the
  server bundle alongside it). Fixed to `pagefind --site dist`.
- `src/styles/tailwind.css` — `@import` statements must come before
  `@tailwind base/components/utilities` (plain CSS rule: `@import` must
  precede all other statements). Get this order backwards and the Vite build
  fails outright.
- **`public/.assetsignore`** (new file, contents: `_worker.js`) — a second
  deploy failure (`Uploading a Pages _worker.js directory as an asset`)
  happened because Wrangler's Assets upload saw `dist/_worker.js` (the server
  bundle) sitting inside the `[assets] directory = "./dist"` tree and refused
  to treat server code as a public static asset. This gitignore-style file
  excludes it from that upload without needing to change the output
  directory structure.
- **`react-dom/server` → `react-dom/server.edge` Vite alias** (in
  `astro.config.mjs`, production-only via `import.meta.env.PROD`) — a third
  deploy failure surfaced only at runtime, after a successful deploy:
  `Uncaught ReferenceError: MessageChannel is not defined`. React's default
  `react-dom/server` resolution picks the "browser" build, which needs
  `MessageChannel`, an API the Cloudflare Workers runtime doesn't provide.
  Aliasing to the edge-compatible build fixes it. Verified locally with
  `wrangler dev` + a real HTTP request before pushing (Astro's own dev server
  doesn't exercise this code path, so `npm run dev` alone won't catch a
  regression here).
- **Tailwind Preflight silently overriding custom heading styles** — `h1`/
  `h2` `font-weight` rules in `globals.css` weren't wrapped in `@layer base`,
  so Tailwind's own Preflight reset (`font-weight: inherit`) won on cascade
  order even though the custom rule came later in the file. Fixed by moving
  the relevant `html`/`body`/`h1`–`h6`/`p`/`*:focus-visible` rules into
  `@layer base { ... }`, which puts them in the correct Tailwind cascade
  layer instead of relying on source order.
- Two `personal.yaml` data fixes (not code, but worth flagging since they
  contradict what a stale copy of the source YAML might still say elsewhere):
  the domain typo `stevensantillanp.com` → `stevensantillan.com`, and
  `googleScholar`/`researchGate` were filled in from the master doc's own
  "Información del Usuario" section (they were still `[PROPORCIONAR URL]`
  placeholders in the YAML despite the real URLs being available).
- Displayed name was shortened to "Steven Santillan" (no middle name, no
  second surname, no accent) in the Header logo, the Home `<h1>`, and the
  browser-tab title suffix, per the site owner's request — but the **full**
  legal name (`personal.fullName` = "Steven Isaac Santillan Padilla", tilde
  already removed per the same request) is still used in the Footer
  copyright line and the Person JSON-LD, where a full/formal name is more
  appropriate.

---

## 11. Local development

```bash
npm install
npm run dev             # http://localhost:4321
npm run build            # astro build → dist/
npm run search:build     # build the Pagefind index (run after build)
npm run preview          # wrangler dev, serves the built worker locally
npm run deploy            # build + wrangler deploy (needs Cloudflare auth)
```

Node 20 LTS+ is expected (developed against Node v24.18.0 / npm 11.16.0).

### Troubleshooting

- **"Cloudflare does not support sharp at runtime" warning on build** — 
  informational only; no images currently go through Astro's image
  optimization pipeline, so this doesn't affect anything today.
- **"Enabling sessions with Cloudflare KV" / "Invalid binding SESSION"
  warning** — `@astrojs/cloudflare` auto-enables its session helper; this
  project doesn't currently use Astro sessions, so the warning is
  informational. If sessions are used later, add a `SESSION` KV namespace
  binding to `wrangler.toml`.
- **A new field in a YAML/MDX file doesn't show up / dev server throws a
  content error** — you almost certainly need to add the field to the
  matching schema in `src/content/config.ts` too; Zod validation is strict by
  default (unknown extra fields are fine, but a schema expecting a field that
  isn't present, or a wrong type, throws at content-sync time).
