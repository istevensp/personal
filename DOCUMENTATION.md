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
│   ├── favicon-1826x1826.png      # master icon — used as default OG/social image and largest manifest icon
│   ├── site.webmanifest
│   ├── robots.txt
│   └── images/
│       ├── ORCID_iD.svg           # Official ORCID brand mark (256x256), used in Header/Footer/Hero
│       └── profile.jpg            # (see §9)
├── src/
│   ├── content/
│   │   ├── config.ts              # Content Collections schemas — see §3
│   │   ├── profile/*.yaml         # personal, education, certifications, interests, awards-honors
│   │   ├── experience/*.yaml      # academic, professional, thesis-advisory
│   │   ├── teaching/courses.yaml
│   │   ├── teaching/syllabus/     # One YAML per course per language — see §4.3
│   │   ├── maps/evaluaciones.yaml # 55 SAAC evaluation records (historical, all courses)
│   │   ├── publications/*.yaml    # published, accepted, under-review
│   │   ├── projects/research/*.mdx
│   │   ├── projects/community/*.mdx (+ _drafts/)
│   │   └── news/*.mdx
│   ├── components/
│   │   ├── Layout/                # BaseLayout, Header, Navigation, Footer
│   │   ├── Home/                  # Hero + featured-content sections for index.astro, incl. PublicationsTimeline
│   │   ├── Publications/          # PublicationsTimelineRow/Toggle — shared by Home and /publications
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

- **New research project**: add a new `.mdx` file under
  `src/content/projects/research/`, following the frontmatter shape of an
  existing file. To have it show up in Home's "Current Research Projects"
  section, set `current: true` — that section only shows ongoing research
  projects now, regardless of `featured` (see §5's Home section and 4.4).
- **New community project**: add a new `.mdx` file under
  `src/content/projects/community/`. Set `program`/`programEs` if the
  project is one instance of a larger multi-year initiative (see 4.4) —
  every current community project has one; it's optional in the schema
  only so older/unmigrated entries don't fail validation.
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
  `src/content/experience/thesis-advisory.yaml` (currently empty). Rendered
  on `/projects` (not `/experience`) as a third section alongside Research
  and Community Engagement — moved there from the Experience pages per the
  site owner's request, since thesis advising is closer to project work
  than to a job/position entry.
- **Profile/education/certifications/awards**: edit the corresponding YAML
  file directly under `src/content/profile/` or `src/content/experience/`.
  `education` and `awardsHonors` entries both support `hidden: true` (same
  convention as `draft` for projects/news — keep the entry in the file,
  just don't render it) for content the owner wants recorded but not
  publicly listed right now (e.g. an in-progress PhD entry, a scholarship
  entry with no public write-up yet). Both `education` and `awardsHonors`
  entries also support an optional `links: Record<string, string>`
  (rendered as plain external links, `target="_blank"`, key used verbatim
  as the visible label via a `capitalize` CSS class — write multi-word
  keys like `'official photo by ESPOL'` if you want each word's first
  letter capitalized) — with one special case in `awardsHonors` only: a
  link whose key is exactly `"certificate"` renders with a `download`
  attribute instead (filename derived from the award's `name`), so
  clicking it downloads the file rather than opening it in the browser's
  PDF viewer. `education`'s `links` has no such special case (used so far
  for a third-party evidence photo hosted externally, not a downloadable
  file). Certificate PDFs live under `docs/awards/` (same public-repo
  convention as the CV PDFs in §9), referenced via a
  `github.com/.../raw/main/docs/awards/...` URL.

### 4.1 Why "Current Courses" and "Historical Teaching Record" are two separate sections

`src/pages/teaching/index.astro` shows two grids rather than one merged list,
because `courses.yaml`'s curated entries and the 55 raw records in
`evaluaciones.yaml` are two different data shapes with no reliable automatic
match (SAAC course codes vs. a hand-curated course list):

1. **Current Courses** — cards driven by `courses.yaml`, showing whatever
   `semesters` you've filled in there.
2. **Historical Teaching Record** — cards derived directly from
   `evaluaciones.yaml`, grouped by `courseCode`, sorted by most recent year,
   filterable by area (`CCPG*` → "Computer Science", `TLMG*` → "Telematics &
   Networks" — see the `areaLabels` map at the top of the page file).

Two of the three current courses **are** confirmed to be the same course as
one of the historical SAAC records — "Data Structures" = "Estructuras de
Datos" (CCPG1034) and "Distributed Systems and Cloud Computing" = "Sistemas
Distribuidos y Computación en la Nube" (CCPG1055) — recorded via each
course's `historicalNames: string[]` field in `courses.yaml`. This mapping is
used by the **Teaching Timeline** (§4.2) to merge the two into a single
entry (same color, same "jump to card" anchor), but it does **not** merge
the two grids themselves — they stay visually separate, each still showing
its own card for the same real-world course. "Algorithms" has no
`historicalNames` (it's a genuinely new course, never taught before), so it
only ever appears in Current Courses.

If you confirm a mapping for another course later, add its Spanish name(s)
to that course's `historicalNames` array in `courses.yaml` — everything that
reads it (Teaching Timeline merge/anchor logic, the `courseNameToSpanish`
EN/ES map) picks it up automatically, no other code changes needed.

### 4.2 Teaching Timeline

Below the page intro and above "Current Courses", a collapsed-by-default
block (`src/pages/teaching/index.astro`) shows:

- A one-line summary: distinct courses, semesters, total parallels, and
  starting year (e.g. "9 distinct courses taught over 9 semesters (58
  parallels total) since 2021") — reuses `TimelineToggle` from
  `src/components/Publications/PublicationsTimelineToggle.astro` (a
  publications-named but fully generic show/hide component; see §5).
- A **legend** (grid of colored dots + course name + total parallel count)
  — one consistent color per distinct course, assigned alphabetically from a
  12-color palette (`COURSE_COLORS`/`COURSE_DOT_COLORS` in the page file) so
  colors don't reshuffle when new semesters are added.
- A **vertical timeline** (newest semester first, stops at the current
  semester — any `courses.yaml` semester with `status: 'upcoming'` is
  excluded) with a line + dot per semester and that semester's courses as
  colored chips, each showing `×N` when more than one parallel of that
  course ran that semester.

Every course name (legend entries and timeline chips) is a link to that
course's card — `#course-{courseId}` for current courses, `#course-{code}`
for historical-only ones — via `courseAnchorMap`, built alongside the
timeline data. `CourseCard.astro` accepts an `id` prop for this (see §5).

**Parallel vs. semester counts — a real bug that got fixed once already:**
the legend's `×N` must be a count of individual parallels/sections
(`courseParallelTotals`, built from a `Map<courseName, count>` per semester,
not a plain array), not a count of distinct semesters. The two numbers
easily look similar during a quick read but diverge fast for
multi-parallel courses (e.g. "Data Networks" was taught in 5 different
semesters, but 20 total parallels across them) — if a future edit
accidentally goes back to counting semesters, the legend's numbers will stop
summing to the top-line "N parallels total", which is the tell.

**English/Spanish course names**: unlike the rest of the site (§7), course
names on this page respond to the EN/ES toggle. This uses a page-local
`SPANISH_NAMES: Record<string, string>` dictionary (confirmed by the site
owner, not derived automatically — a course's SAAC record can already be in
English while its real Spanish name differs, e.g. "Internetworking" is
really "Conmutación y Enrutamiento") applied via a new, generic
`data-lang-en`/`data-lang-es` attribute pair (see §7) rather than the global
chrome-only i18n dictionary.

### 4.3 Course syllabus detail pages (`/teaching/[code]`)

`src/content/teaching/syllabus/` is a **multi-entry** content collection
(`teachingSyllabus`, `glob()`-loaded), one YAML file per course *per
language*, extracted from official course PDFs by the site owner's own
tooling. Naming convention: `EN-Syllabus-{CODE}.yaml` /
`SPA-Syllabus-{CODE}.yaml` (e.g. `EN-Syllabus-CCPG1034.yaml`,
`SPA-Syllabus-CCPG1034.yaml`) — **drop new files straight into that folder
with the same naming pattern; no code changes needed.** The schema (see
`config.ts`) captures: `course` (code/name/program/credits/contact_hours),
`bibliography` (textbooks/supplemental_materials), `course_information`
(description/prerequisites/corequisites/course_type), `course_goals`
(instruction_outcomes/student_outcomes), and `topics`.

`src/pages/teaching/[code].astro` is a prerendered detail page
(`getStaticPaths()` derives one path per distinct `course.code` found in the
collection, lowercased for the URL, e.g. `/teaching/ccpg1034`). It pairs up
the `en`/`es` entries for a code by index across every list field
(`pairLists()` in the page) so each item can be shown bilingually via
`data-lang-en`/`data-lang-es` — this assumes the English and Spanish syllabus
files list the same items in the same order; if they don't, ES falls back to
the EN text for that index rather than crashing or showing a blank.

**`CourseCard.astro`'s new `syllabusHref?: string` prop** renders a "View
course details" link (bottom of the card, next to "Course repository" if
both exist) only when a syllabus file exists for that course's code. Since a
current course's own `code` field is frequently still `[PROPORCIONAR]`,
`teaching/index.astro`'s `syllabusHrefForCourse()` helper falls back to the
real historical SAAC code via `courseIdToRealCode` (built from
`historicalNames`, §4.1) when the course's own `code` isn't set — this is
why the "Data Structures" *current* course card can link to
`/teaching/ccpg1034` even though `courses.yaml`'s own `code` for that entry
is still a placeholder. The same `realCodeForCourse()` resolution is also
used to show the real course code badge (instead of `[PROPORCIONAR]`) and to
merge historical semesters into a current course's card via
`historicalSemestersForCourse()`, so a Current Courses card for a merged
course (e.g. "Data Structures") shows the *same* years-taught range,
parallel count, and evaluations accordion as its Historical Teaching Record
counterpart — not just its own 2026 semester(s).

**Detail page content deliberately excludes credits, contact hours,
prerequisites, and corequisites** — even though the schema captures them —
per the site owner's request; they didn't feel worth surfacing. "Topics
Covered" is intentionally the most visually prominent section (colored
chips cycling through a 13-hue palette, `TOPIC_COLORS` in the page file,
plus a bouncing ✨ emoji) to compensate for the rest of the page reading as
fairly plain otherwise. A "Taught N times (year range)" badge next to the
title, and a "View evaluations" accordion (visually identical to
`CourseCard`'s), are built from `src/lib/teaching.ts`'s
`getSemestersForCode()` — the same historical+current merge logic as
`teaching/index.astro`, factored out so it isn't triple-implemented. The
"N times" count deliberately excludes `status: 'upcoming'` semesters (a
scheduled-but-not-yet-taught semester still shows in the accordion, with an
"Upcoming" badge, but doesn't inflate the "taught" count).

**A real bilingual-pairing bug, already fixed once**: `pairLists()` used to
zip English and Spanish lists by iterating the English array — if a
course's English syllabus extraction was incomplete for a field (this
happened for real: TLMG1030's English `topics` had only 1 of 5 real items
and its `instruction_outcomes` was empty; TLMG1037's English
`student_outcomes` was empty), the real Spanish content for the missing
items was **silently invisible on the page, in both languages** — not just
mislabeled. Fixed to derive the merged list's length from whichever
language's array is longer, so real content from either language never
disappears just because the other language's extraction was incomplete for
that specific field. The same fix (`pick()` helper, preferring non-empty
over merely non-null) applies to single-string fields like `description`,
since `??` doesn't fall through on `""`.

### 4.4 Community Engagement's program→project hierarchy, and About Me's tabs

**A project belongs to a program.** When the site owner sent real data for
Community Engagement, it revealed that 5 of the 6 existing project MDX
files had it backwards: the file's `name` field (rendered as the card's
big title) actually held the name of the multi-year *program* the project
belonged to (e.g. "Integrated Coastal Management in Manglaralto Parish"),
while the project's own specific title was sitting, shortened, in
`description`. The schema now has a distinct, optional `program`/
`programEs` field (rendered as an italic subtitle under the real title, on
both the card and the detail page — see `ProjectCard`/`community/
[slug].astro` in §5) precisely so a real program spanning several years can
have multiple distinct project entries (different `startDate`/`endDate`,
different `myRole`) without collapsing them into one card or duplicating
the program name as if it were the project's own title. `program` is
optional rather than required specifically so the two pre-existing
projects this restructuring didn't touch (`schooling-platform-
sustainability`, and the draft `_drafts/la-union-connectivity.mdx`) don't
need fabricated program data just to satisfy the schema.

**A project can span more than one calendar year.** Both Research and
Community Engagement now compute `yearsSpanned(startDate, endDate)` (an
inline array of every year touched, using `new Date().getFullYear()` in
place of an open `endDate`) rather than trusting the frontmatter's single
`year` number for filtering or the badge label. This mirrors the multi-year
`years` array already used by Teaching's historical courses (§4.1) for the
same reason: a project that ran 2024–2025 needs to show up under *both*
year filter buttons, and its badge should read "2024–2025", not just
"2024". The year-filter buttons and grids on `/projects` are wired by a
small `wireYearFilter(groupId, gridId)` helper called once for Research and
once for Community — deliberately not shared with Teaching's own filter
wiring script, since the two pages' DOM ids and filter axes (Teaching also
filters by area) differ enough that a shared abstraction would need as
many parameters as it saves.

**About Me's four subsections are now tabs**, not stacked page sections —
same `role="tablist"`/`data-tab` + a small vanilla `<script>` pattern
already used by `/experience` (Academic/Industry) and now also used by
`about.astro` for Education/Research Interests/Certifications/Honors &
Awards, with Education open by default. Within the Research Interests tab,
`researchInterests` and `technicalSkills` both went from flat/loosely-typed
data (a plain string array; a `Record<string, string[]>` keyed by camelCase
group names like `cloudSecurityAndGRC`) to the same shape: an array of
`{ category, categoryEs?, topics|items, topicsEs|itemsEs? }`. Each research
category renders as its own card with a fixed accent color + emoji
(`CATEGORY_STYLES` in `about.astro`, indexed by array position — calm hues
only, same red/orange/amber exclusion as `YEAR_COLORS`), while technical
skill categories render as plain (uncolored) cards underneath, under their
own "Technical Skills" heading — the color treatment is deliberately
reserved for Research Interests so the two groups stay visually distinct
rather than competing for attention.

**A schema shape change can strand the dev server, even when the code is
correct.** Changing `researchInterests` from `string[]` to an array of
category objects (and `technicalSkills` from a `Record` to an array)
briefly left `astro dev` serving a blank page titled "TypeError" — a stale
in-memory content-layer cache from before the schema change, not an actual
bug (`npm run build` succeeded throughout). Restarting the dev server
process resolved it. Worth remembering the next time a content collection's
field *shape* (not just its values) changes: if the dev server starts
misbehaving right after, restart it before assuming the new code is wrong.
This same class of schema change is also why `Home/HeroSection.astro`
briefly rendered `[object Object]` in its hero badges — it was still doing
`researchInterests.slice(0, 6)` and rendering each item directly, unaware
the array now held category objects instead of strings; fixed by
flattening `group.topics` across categories before slicing.

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
`RecentNews`. All fetch their own content via `astro:content` — no props
passed from the page. `FeaturedAwards.astro` and `ContactCTA.astro` used to
sit at the end of this list ("Awards & Honors" and "Get in touch" sections)
but were both removed (not just hidden) at the site owner's request —
the CTA was judged redundant with `/contact`, and Awards & Honors with
`/about`'s own Honors & Awards tab. If either is ever wanted back, they'd
need to be rebuilt from scratch (or recovered from git history) rather than
un-hidden, since the component files themselves were deleted.

`FeaturedProjects.astro` (the "Current Research Projects" section) only
queries `projectsResearch` (not `projectsCommunity`) and filters to
`data.current === true` — it used to merge both collections and take the
top 3 by year (falling back through `featured: true` first), but since no
project currently has `featured: true`, that heading ("Featured Projects")
was showing plain recent projects under a misleading label. The section
title is now literally accurate: it shows whichever research projects are
actually ongoing right now, and doubles as a link to `/projects` (see 7.4).

`PublicationsTimeline.astro` replaced an earlier `FeaturedPublications.astro`
(now deleted) after 3 rounds of design iteration. It renders a horizontal,
newest-first row of the 6 most recent publications (across all statuses,
sorted by a `sortKey` combining year+month), each as a `w-48` column with a
status-colored dot, date + status label, `line-clamp-2` title, and
`line-clamp-1` venue, connected by fixed-width line segments and wrapped in
an `overflow-x-auto` container for mobile. Status-dot colors: `Published` →
`bg-success`, `Accepted` → `bg-warning`, `Under Review` → `bg-gray-400`. Uses
the shared `formatMonthYear()`/sorting helpers pattern also used by
`src/lib/publications.ts`. The "Publications Timeline" heading is itself a
link to `/publications`, in addition to the separate "View all publications"
link next to it. A `PublicationsTimelineToggle` (see below) lets the visitor
collapse/expand the row; on Home it's expanded by default.

`HeroSection.astro` also renders the profile photo box (see §9) and the
social-links row (email, GitHub, Google Scholar, LinkedIn, ResearchGate,
ORCID) directly under the bio. The ORCID link uses the real brand icon
(`public/images/ORCID_iD.svg`), like the Footer.

`personal.yaml` has two distinct bio fields, not one: `tagline`/
`taglineEs` (short, 2 sentences — used only on Home, wrapped in a full
`<a href="/about">` link since Home is meant to hook and redirect, not
duplicate) and `summary`/`summaryEs` (longer — used on `/about`'s intro
and as that page's meta description; Home's meta description uses
`tagline` instead, since it's a better length for search-result
snippets). `profile`/`profileEs` (the 4 bullet points under the summary
on `/about`) are a separate array, bilingual since a 2026-07-29 pass —
`profileEs` didn't exist before that. `currentRole.title` (from
`academicExperience`, rendered next to the photo) needs its own
`data-lang-en`/`data-lang-es` wiring using `currentRole.titleEs` — this
was missing for a while (the title just never translated) until it was
noticed and fixed; if you add a new field to `HeroSection.astro` that
pulls from a bilingual YAML entry, remember it needs this wiring
explicitly, it's not automatic.

### Publications (`src/components/Publications/`)
Shared between Home's `PublicationsTimeline` and the collapsible timeline
block on `/publications` (`src/pages/publications/index.astro`):
- **PublicationsTimelineRow.astro** — pure rendering of the dot+line
  timeline row, given a `timeline` array of `{href, title, venue, dateLabel,
  status}` and an optional `id`/`hidden`. No data fetching of its own.
- **PublicationsTimelineToggle.astro** — a show/hide `<button>` with an
  animated chevron icon, `aria-expanded`, and its own small inline `<script>`
  (delegated via `[data-timeline-toggle]`, so multiple instances on one page
  work correctly). Despite living in `Publications/` and being named for
  that use case, it's fully generic (`targetId`/`defaultExpanded` props,
  toggles `.hidden` + swaps a `common.showTimeline`/`common.hideTimeline`
  `data-i18n` label) — it's also reused, as-is, by the Teaching Timeline
  (§4.2), imported directly from this folder.

On `/publications`, the timeline block sits above the status filter buttons,
inside a `bg-primary/5 border-primary/20` card with a bouncing 📊 emoji and
the prompt "Prefer a quick timeline view?" — **collapsed** by default (unlike
Home's, which defaults to expanded) and shows **all** publications, not just
the 6 most recent.

### Cards (`src/components/Cards/`)
Pure presentational `.astro` components, each taking plain props (no direct
content-collection access) so they can be reused across Home, index pages, and
detail pages: `ProjectCard`, `PublicationCard`, `NewsCard`, `ExperienceCard`,
`CourseCard` (the only one with built-in interactivity — a native
`<details>/<summary>` accordion for semester evaluation links, no JS needed).
`CourseCard` also accepts an optional `id` (anchor target, used by the
Teaching Timeline's "jump to card" links — the card root gets `scroll-mt-24`
so it doesn't land under the sticky header), `nameEs`/`descriptionEs`
(bilingual title and description via `data-lang-en`/`data-lang-es`, see
§7), and `syllabusHref` (§4.3). Year badges use a 10-hue `YEAR_COLORS`
palette deliberately excluding red/rose/pink/orange/amber — those already
mean warning/error/"In Progress"/"Upcoming" elsewhere on the same card, so
using them for a plain year would read as alarming for no reason.

`ExperienceCard` accepts an optional `highlightsEs?: string[]`, paired by
index with `highlights` (same `data-lang-en`/`data-lang-es` pattern),
`department`/`departmentEs`/`program`/`programEs` (rendered as an italic
subtitle when either is present — only populated for the current position
and the Lecturer/Project Director/Lab Head entry, the two where a specific
degree program applies), and `courses`/`coursesEs` rendered as colored,
clickable labels under a "Courses Taught" heading (color + `/teaching`
anchor resolved via `getCourseColorMap()` in `src/lib/teaching.ts` — see
§4.2 for the color-assignment logic).

`ProjectCard` grew several optional bilingual props beyond its original
`href`/`name`/`year`/`myRole`/`excerpt`/`type`/`current`/`featured`:
`nameEs`, `program`/`programEs` (italic subtitle, Community Engagement
only — Research projects don't have this concept), `myRoleEs`, `excerptEs`
— all following the same `data-lang-en`/`data-lang-es` pattern. `myRole`
renders as its own colored badge (`bg-violet-100`/`text-violet-800`),
visually distinct from the type badge (Research=`badge-success`,
Community=plain) and the year badge. **`year` is typed `number | string`**
— pages now often pass a computed range label (`"2024–2025"`) rather than
a bare year, via a small `yearRangeLabel(startDate, endDate)` helper
duplicated in `projects/index.astro` and both `[slug].astro` detail pages
(kept as three small copies rather than a shared import, since each needs
slightly different inputs and it's a two-line pure function).

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
| `/teaching/[code]` | `.../teaching/[code].astro` | Course syllabus detail — see §4.3; only exists for codes with a syllabus file |
| `/teaching/data-structures` | `.../teaching/data-structures/index.astro` | Data Structures course materials hub — see §12 |
| `/teaching/data-structures/[parcial]/[topico]` | `.../data-structures/[parcial]/[topico].astro` | Topic detail (downloads, Java source, external links) — see §12 |
| `/projects` | `src/pages/projects/index.astro` | Research + Community grids + Thesis Advisory |
| `/projects/research/[slug]` | `.../research/[slug].astro` | `slug` = MDX frontmatter `projectId` |
| `/projects/community/[slug]` | `.../community/[slug].astro` | same |
| `/publications` | `src/pages/publications/index.astro` | Client-side status filter; collapsible full timeline (§5) |
| `/publications/[slug]` | `.../publications/[slug].astro` | `slug` = YAML `id`; ScholarlyArticle JSON-LD |
| `/experience` | `src/pages/experience/index.astro` | Academic/Professional tabs |
| `/experience/academic` | `.../academic.astro` | Full academic experience list (Thesis Advisory lives on `/projects`, not here) |
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

The site started with a narrow i18n scope (nav labels + a handful of
buttons) and has since grown, page by page, into covering almost every
piece of chrome text on the site, plus a growing set of bilingual content
fields. There are now three distinct mechanisms in play — know which one
applies before adding a new translatable string.

### 7.1 `data-i18n` — the global chrome dictionary

`src/i18n/strings.ts` holds an EN/ES dictionary keyed by dotted names
(`nav.*`, `common.*`, `experience.*`, `projects.*`, `publications.*`,
`news.*`, `about.*`, `contact.*`, `teaching.*`, `home.*`). Elements carrying
that text are tagged `data-i18n="key"`. This now covers, across the whole
site: nav labels; page `<h1>`s; section `<h2>`/`<h3>` headings (many of
which are also `<a>` links to the section's full page — see 7.4); status/
type/role badges (`Research`/`Community`, `Published`/`Accepted`/`Under
Review`, `Ongoing`, `Featured`, `Current`); "Back to X" links and 404/empty
states; filter button labels. `strings.ts`'s own file comment still says
"chrome-level UI text only" — that's accurate in spirit (it never holds a
whole paragraph of real content), but the surface area under it is now much
larger than the original nav-only scope.

A `<script>` in `BaseLayout.astro` (not React — needs to run on every full
page load, including SSR navigations) reads `localStorage.lang` on load and
whenever `LanguageSwitcher` fires `languagechange`, then walks
`document.querySelectorAll('[data-i18n]')` and swaps `textContent`.

A key can be reused across unrelated pages when the literal string is
identical in both languages (e.g. `common.featured` is shared by `NewsCard`
and `ProjectCard`'s "Featured" badge) — don't create a per-page duplicate
key just because the two usages live in different files.

### 7.2 `data-lang-en`/`data-lang-es` — per-entry bilingual content

The same `applyTranslations()` function in `BaseLayout.astro` also handles
a second, more generic attribute pair: any element with
`data-lang-en="…" data-lang-es="…"` gets its `textContent` swapped to
whichever matches the active language, independent of the global
`strings.ts` dictionary. This is how **content-collection data** — not
chrome — becomes bilingual, one field at a time, via an optional `*Es`
sibling field in the schema (`nameEs`, `descriptionEs`, `titleEs`,
`programEs`, `myRoleEs`, `categoryEs`, `topicsEs`/`itemsEs`,
`degreeProgramsEs`, `levelEs`, `fieldEs`, `summaryEs`, `highlightsEs`,
`coursesEs`, …). The pattern at the call site is always the same:

```astro
<span data-lang-en={fooEs ? foo : undefined} data-lang-es={fooEs}>{foo}</span>
```

(the `data-lang-en` side is only set when a translation actually exists —
otherwise the element is left untagged and just shows the English text in
both languages, which is the correct fallback for content nobody has
translated yet, rather than showing nothing).

This now covers real content across most of the site: Teaching (course
names), Experience (title, organization, department/program subtitle,
description, highlights, courses-taught labels), Projects/Community
Engagement (title, program subtitle, role, excerpt, degree-program badges),
About Me (education degree title/description, research-interest/technical-
skill categories and items, award name/description), and the Home hero
summary. **Publications and Research-type projects are the deliberate
exception** — their content (paper titles/abstracts, research project
write-ups) stays English-only by design (see 7.3), since real academic
output shouldn't be paraphrased into a second language.

Don't reuse `data-i18n` for this kind of thing — `data-i18n` always looks
up a *key* in `strings.ts`; `data-lang-en`/`data-lang-es` carry the literal
text for both languages directly on the element.

### 7.3 What still doesn't translate, on purpose

Publication metadata (title, authors, venue, abstract, keywords) and
Research-type project write-ups (`problem`, `myContribution`,
`methodology`, results, and the MDX body) are English-only — that's a
scope decision, not a gap: the site owner explicitly asked for it ("los
papers no [se traducen] porque son todos en inglés"), since academic
publications and research narratives are real citable text that shouldn't
be re-worded into a second language just for the toggle. Community
Engagement projects and About Me *are* translated, since that content is
the site owner's own descriptive framing rather than a citation.

### 7.4 Section headings that double as links

Several `<h2>` section headings on Home (Publications Timeline, Current
Research Projects, Recent News) wrap an `<a>` pointing at that section's
full page, in addition to a separate, more explicit "View all …" link next
to them. When adding a new Home section, prefer this pattern over a plain
`<h2>` — it gives a second, more discoverable way to reach the full page
without relying on the visitor noticing the smaller link.

### 7.5 The one React-island exception: `NewsFilter.jsx`

Every i18n mechanism above assumes a global `<script>` can walk the DOM
after the fact and swap `textContent`. That breaks for a React island that
re-renders its own JSX from state (a click handler, a re-render) *after*
`applyTranslations()` already ran once — the next render would overwrite
the translated text with the original English prop/literal, since React
has no idea `data-i18n` attributes exist. `NewsFilter.jsx` (the category
filter buttons on `/news`) hit exactly this: its button labels are plain
JS strings (`ALL_CATEGORIES`), not `data-i18n`-tagged DOM the global script
can safely own. The fix was to make the component itself language-aware:
it keeps its own `lang` state (initialized from `localStorage.getItem
('lang')`, updated by listening for the same `languagechange`
`CustomEvent` every other i18n path relies on), and looks up
`strings[lang]['news.category.' + category]` directly from the imported
`strings` dictionary when rendering each button label. Any *other* React
island that renders translatable text from its own state (not a static
prop passed in from server-rendered Astro) needs the same treatment — copy
this pattern rather than tagging its JSX with `data-i18n`, which won't
survive a re-render.

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

### 8.1 Sitemap

`public/robots.txt` has declared `Sitemap: https://stevensantillan.com/
sitemap-index.xml` since the very first commit, but nothing ever generated
that file — `@astrojs/sitemap` was never added to `astro.config.mjs`'s
`integrations` array, so the URL 404'd in production (confirmed with
`curl` against the live site). Fixed by installing the package and adding
`sitemap()` to the integrations list; `npm run build` now emits
`dist/sitemap-index.xml` (an index pointing at `dist/sitemap-0.xml`, which
lists every prerendered route under `https://stevensantillan.com/`). No
further config needed — the integration reads `site` from `astro.config
.mjs` and walks the build output automatically. See `docs/DECISIONS.md`
for the reasoning (why this was worth fixing, not just leaving as-is).

---

## 9. Known placeholders / things the site owner still needs to provide

None of these were invented — they're left as explicit gaps rather than
fabricated content:

- **Favicon set**: `public/` has a full PNG icon set —
  `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`,
  `favicon-64x64.png`, `favicon-128x128.png`, `apple-touch-icon.png`
  (180×180), and `favicon-1826x1826.png` (a master image, referenced as
  the largest `site.webmanifest` icon — **not** the OG/social-share image
  default anymore, see the profile-photo note below). `BaseLayout.astro`'s
  `<head>` block declares each PNG icon with an explicit `sizes` attribute
  (verified against each file's real PNG `IHDR` dimensions, not just its
  filename). The current artwork (as of 2026-07-30) is a solid "S" initial
  in a circle with the `--color-primary`→`--color-secondary` gradient,
  generated from an SVG source via `sharp` — replacing an earlier
  geometric multi-shape mark that read as an indistinguishable blob at the
  ~16px size browsers/Google actually render favicons at (see
  `docs/DECISIONS.md` DEC-025; there's no SVG source file checked into the
  repo, only the rendered PNGs, so regenerating a variant means re-creating
  that source). This set went through several prior states worth knowing
  about if a `git blame` looks confusing: it started as a larger set
  (`favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png`, `android-chrome-192x192.png`), was reduced to
  just `favicon.ico`/`favicon.png`/`android-chrome-512x512.png` (which
  briefly broke the site because the code still referenced the old files),
  was replaced with a PNG-only set using `icon.png` as the 1826×1826
  master (later renamed `favicon-1826x1826.png` after a dimension mismatch
  bug), and was finally re-exported into the current file names — then the
  artwork itself was redesigned on 2026-07-30. There is no `favicon.ico`
  anymore, which is fine since every browser that matters supports PNG
  `<link rel="icon">` with explicit sizes.
- ~~**Profile photo**~~ — resolved (was a real gap when this section was
  first written, no longer one). `profile.jpg` lives at
  `src/assets/images/profile.jpg` (moved there from `public/images/` so
  Astro can process it — see DEC-018) and is rendered via the `<Image>`
  component from `astro:assets` in `HeroSection.astro` and `contact.astro`
  (`loading="eager"` + `fetchpriority="high"` on both, since it's
  above-the-fold on each page — the component's lazy-load default would
  otherwise delay it). It's also `BaseLayout.astro`'s default `image` prop
  now, i.e. the Open Graph/Twitter Card image, instead of the favicon.
- **CV PDFs**: `docs/cv-industry.pdf` and `docs/cv-academic.pdf` (see
  `docs/README.md`). The "CV & Resume" section on `/contact` already links to
  their GitHub raw URLs.
- **`src/content/experience/thesis-advisory.yaml`** — empty array, schema
  ready (`studentName`, `thesisTitle`, `year`, `institution`,
  `role: Advisor|Co-Advisor`, `status: completed|in-progress`).
- **`hidden: true` entries** — real data kept in the source YAML but not
  rendered, per the same convention as `draft` for projects/news (§4). As
  of this writing: the "PhD Candidate" entry in `education.yaml` (the site
  owner asked it not be shown for now) and the "OAS Scholar" entry in
  `awards-honors.yaml`. Both `about.astro`'s `degrees`/`awards` filter
  these out with `.filter((x) => !x.hidden)` — if either should go public
  again, just remove the flag; the rest of the data is already real and
  complete.
- **One community project deleted outright, not hidden**:
  `schooling-platform-sustainability.mdx` had no real content (every field
  was still a placeholder) and the site owner asked for it to be removed
  entirely rather than marked `draft`/`hidden` — unlike the other
  "incomplete content" cases in this section, there was nothing worth
  keeping a record of.
- **Every `[PROPORCIONAR]` string** inside the project MDX files
  (`problem`, `myContribution`, `methodology`, etc.) and publication YAML
  (`abstract`, `doi`, author lists, resource links). These render as literal
  `[PROPORCIONAR]` text on the live site until filled in — grep for it before
  going live: `grep -rn "PROPORCIONAR" src/content`.
- **`under-review.yaml`'s `links.repository`** was intentionally removed
  (not just left as a placeholder) for the paper "How are HPC, Edge and
  Serverless Architectures built in the Cloud Continuum?..." — the site
  owner asked for it to stay hidden until the paper is actually accepted,
  as a precaution while it's still under review. Don't re-add a repository
  link there without checking the paper's status first.
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
  informational only. `profile.jpg` does go through the `<Image>`
  component from `astro:assets` (see §9), but that optimization happens
  at **build time** (in CI/Node, generating a static WebP baked into
  `dist/`), not at request time — Cloudflare Workers never runs `sharp`
  itself. The warning would only matter if a page used on-demand image
  transforms at request time, which nothing here does (every route is
  prerendered, see §10).
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
- **`@mdx-js/rollup` build error inside any `.mdx` file under
  `external/data-structures/`** — that repo's MDX files must use
  `{/* comment */}`, never `<!-- HTML comment -->` (invalid MDX syntax,
  breaks the build). See §12.4.

---

## 12. Data Structures course materials (`/teaching/data-structures`)

Renders the CCPG1034 Estructuras de Datos course — slides, guides, Java
source, and downloads — sourced from a **separate public repo**,
`istevensp/data-structures`, not copied into this repo's git history. See
`docs/DECISIONS.md` DEC-026 through DEC-030 for the reasoning; this
section is the technical reference for how it fits together.

### 12.1 Sync mechanism

`scripts/sync-data-structures.mjs` runs via npm's `predev`/`prebuild`
lifecycle hooks (before `astro dev` / `astro build`) and populates
`external/data-structures/` (gitignored — never committed to `personal`):

- **Local dev/build**: if `../data-structures` exists (the two repos are
  siblings under the same `Github/` folder), it's copied in directly (fast,
  no network). Otherwise the script does a shallow `git clone` of
  `https://github.com/istevensp/data-structures.git`.
- **CI**: `.github/workflows/deploy.yml` has a second `actions/checkout`
  step that checks out `istevensp/data-structures` directly at
  `external/data-structures` *before* `npm run build` runs. The sync
  script detects `CI`/`GITHUB_ACTIONS` and skips cloning/pulling — it
  just verifies the directory is already there.
- The same script also copies `external/data-structures/files/` into
  `public/teaching/data-structures/files/` (also gitignored) so downloads
  are served from this site's own origin instead of linking out to GitHub.

Run it manually with `node scripts/sync-data-structures.mjs` if you need
to force a re-sync locally (e.g. after pushing new content to the sibling
repo) — it always overwrites `external/data-structures/` and the copied
`files/` from scratch.

### 12.2 Content collections

Two collections in `src/content/config.ts`, both using `glob()` loaders
pointed **outside** `src/content` (Astro's Content Layer API supports
this):

```ts
const dsDocs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './external/data-structures/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sidebar: z.object({ order: z.number() }).optional(),
    parcial: z.union([z.literal(1), z.literal(2)]).optional(), // absent on the 3 index docs
    topic: z.string().optional(),                               // absent on the 3 index docs
  }),
});

const dsMaterials = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './external/data-structures/content/materials' }),
  schema: z.object({
    topic: z.string(),
    parcial: z.union([z.literal(1), z.literal(2)]),
    title: z.string(),
    source: z.string(),
    generated: z.string(),
    items: z.array(dsMaterialItem), // file/code/url mutually exclusive, see below
  }),
});
```

Resulting entry IDs: `dsDocs` glob-derives nested folder paths (`1p/big-o`,
`2p/grafos`, plus the 3 non-topic index docs `index`, `1p/index`,
`2p/index`); `dsMaterials` derives flat filenames (`1p-big-o`, `2p-grafos`).
The topic detail page (§12.3) cross-references a `dsDocs` entry and a
`dsMaterials` entry for the same topic using these ID shapes.

Each `dsMaterials` item is one of three mutually-exclusive kinds — a
downloadable `file`, an embedded `code` source, or an external `url` —
never more than one per item:

| Field | Notes |
|---|---|
| `file` | e.g. `/files/1p/big-o/x.pdf` — absolute path, root is `content/materials`'s sibling `files/` dir in the source repo |
| `code` | e.g. `1p/iteradores/Foo.java` — relative path under `code/` in the source repo |
| `url` | external link (Google Drive); paired with `access` (currently always `"institucional"`) |
| `size` / `bytes` | present for `file` items, absent for `code`/`url` |
| `pages` / `slides` / `entries` | type-specific metadata for PDF/PPTX/ZIP `file` items |
| `lines` / `package` / `class` | metadata for `code` items only |

### 12.3 Routes and rendering

- **`/teaching/data-structures`** (`index.astro`) — builds its own view of
  the two "parciales" by reading `dsMaterials` (grouped by `parcial`) and
  `dsDocs` (for the real topic titles, filtering to entries that have a
  `topic` field so the 3 index docs are excluded). Deliberately does
  **not** render the 3 index MDX bodies — those exist for a student
  browsing the raw repo on GitHub, not for this hub page, which is fully
  data-driven so its topic counts can never drift from reality.
- **`/teaching/data-structures/[parcial]/[topico]`** — `getStaticPaths()`
  iterates `dsMaterials` (12 entries → 12 static pages: the 11 original
  topics plus `arboles-avanzado`, added 2026-08-05 and hidden from the hub
  grid — see §12.9). Each page:
  1. Renders the matching `dsDocs` entry's MDX body via `render()`. All 12
     topics have real written content, but the depth varies: Conjuntos and
     Mapas use generic-but-accurate Java reference material because the
     only source files available were formats that couldn't be read (see
     `docs/DECISIONS.md` DEC-029, still unresolved); Árboles,
     Árboles — Contenido avanzado (both 2026-08-05, DEC-032/DEC-033) and
     Grafos (rewritten 2026-08-11, same pattern as Árboles — a driving
     example carried through the page, complete runnable Java classes,
     comparison tables, common-mistakes and exercise sections) carry
     substantially expanded lesson content; the remaining topics have
     concise intro/summary prose from 2026-08-02. The component still
     doesn't assume the body is non-empty (`{Content && <Content />}`),
     since a topic could in principle exist with only downloads and no
     written prose.
  2. Splits `items` into three groups (`file`/`code`/`url`) and renders a
     section per group, only if that group is non-empty.
  3. For `file` items: a card with type badge, size, and type-specific
     metadata (pages/slides/entries); `href` is
     `` `/teaching/data-structures${item.file}` `` (the YAML's `file` is
     already an absolute path starting with `/files/...`, so this just
     prefixes the route segment — see §12.5 for where the actual files
     live).
  4. For `code` items: source text comes from a static registry built at
     module scope with `import.meta.glob('/external/data-structures/code/**/*.java', { query: '?raw', import: 'default', eager: true })`,
     rendered via `<Code />` from `astro:components`. This is a Vite
     build-time mechanism — no filesystem read happens at request time,
     which matters because Cloudflare Workers has no filesystem access at
     all once deployed.
  5. For `url` items: a plain `target="_blank" rel="noopener noreferrer"`
     link, **never an iframe** (these are Google Drive resources gated by
     ESPOL institutional login; an iframe would show a confusing login
     wall inside the page) — labeled with the bilingual
     "Requires institutional account" string when `access` is set.

### 12.4 Known gotcha: MDX doesn't allow HTML comments

The 11 topic `.mdx` files originally used `<!-- TODO: contenido docente -->`
as a placeholder for body text not yet written. That's invalid MDX — the
`<!--` sequence is parsed as JSX and breaks the build with an
`@mdx-js/rollup` error the first time anything tries to compile it. Fixed
in the source repo by switching to `{/* TODO: contenido docente */}`.
**Anyone editing an `.mdx` file in `istevensp/data-structures` needs to use
this comment syntax, not HTML comments.**

### 12.5 Downloads and the `/files` prefix

The source repo's `files/` directory (~23MB, 51 items) is copied by the
sync script into `public/teaching/data-structures/files/` (gitignored —
regenerated on every build/dev start, never committed). Astro copies
`public/` verbatim into `dist/`, so at build time these end up at
`dist/teaching/data-structures/files/...` and are served by the
`[assets]` binding in `wrangler.toml`, same as every other static file —
no R2 bucket or separate storage needed for the current ~23MB size.

### 12.6 Bilingual chrome, Spanish-only content

Per an explicit decision (mirroring the rest of the site's convention):
the course **content itself** — material titles, filenames, MDX prose —
stays Spanish-only, matching how the course is actually taught. The
**chrome** around it (section headings "Downloads"/"Descargas", "First
Term"/"Primer Parcial", the institutional-account notice, etc.) follows
the same `data-i18n` pattern as the rest of the site — new keys live
under the `teaching.ds.*` namespace in `src/i18n/strings.ts` (see §7.1
for how the dictionary mechanism works).

### 12.7 `courses.yaml` wiring

The `data-structures` entry in `src/content/teaching/courses.yaml` now has
real values for `code` (`CCPG1034` — confirmed by the site owner, same
course as the existing `CCPG1034` syllabus files, see §4.3), `repositoryUrl`
(`https://github.com/istevensp/data-structures`), and `materialsLink`
(`https://stevensantillan.com/teaching/data-structures`). `materialsLink`
existed in the schema before this integration but was never rendered
anywhere — `CourseCard.astro` didn't accept it as a prop. It now renders a
"Course materials" link next to the pre-existing "Course repository" one,
following the exact same `hasX && <a>...` pattern already used for
`repositoryUrl`/`code`.

### 12.8 Not yet built: Phase 3 (auto-sync) and Phase 4 (deploy checklist)

A push to `istevensp/data-structures` does **not** currently trigger a
rebuild of this site — the sync only happens when `personal` itself
builds. The planned mechanism (not implemented) is a `repository_dispatch`
workflow in the content repo that pings `personal`'s Actions on push. See
`docs/PROJECT-STATUS.md` for current priority ordering.

### 12.9 Topic ordering and "sub-page" topics (the Árboles pattern)

Two things worth knowing if you're adding or reordering a topic:

- **Hub card order is explicit, not alphabetical.** `topicsForParcial()`
  in `index.astro` sorts by `topicOrder.indexOf(topic)`, an array hardcoded
  to match the order the owner actually teaches the course in. Adding a
  new topic without adding it to `topicOrder` sorts it first (`indexOf`
  returns `-1`) — there's no build-time check for this. See
  `docs/DECISIONS.md` DEC-031.
- **A topic doesn't have to be an independent hub card.** `arboles-avanzado`
  is a real `dsDocs`/`dsMaterials` topic (own MDX, own route, own
  `getStaticPaths()` entry) but is excluded from the hub grid via a
  `HIDDEN_FROM_HUB` set in `index.astro` — it's reachable only through
  cross-links from within `arboles.mdx`'s prose (a "¿Quieres profundizar?"
  section and an inline link inside the AVL rotations section). This
  pattern exists because the owner's complementary content for Árboles
  (terminology, red-black trees, Splay Tree, B-Tree/B+Tree, Segment/
  Fenwick Tree, spatial trees) was too long for one page but the owner
  didn't want a second card cluttering the hub. If you add another
  "advanced" sub-topic, follow the same pattern: give it a `dsMaterials`
  YAML with `items: []` if it has no downloads of its own, add it to
  `topicOrder` (routing still needs it, even if hidden from the grid), and
  add it to `HIDDEN_FROM_HUB`. See `docs/DECISIONS.md` DEC-032.
