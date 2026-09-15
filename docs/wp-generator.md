# Cozy Studio → WordPress FSE generator

The **WordPress Studio** at `/studio/wp` turns a single brief into a fully
installable [Full Site Editing](https://developer.wordpress.org/themes/block-themes/)
theme. Nothing needs to be installed on the server — the generator runs in the
browser, the ZIP is built client-side, and the same design tokens power the
live iframe preview and the `theme.json` shipped in the archive.

## What the generator produces

For every brief:

- `style.css` with the WordPress theme header + CSS custom properties (design tokens).
- `theme.json` (schema v3) — palette, typography, spacing, block styles, custom templates.
- `functions.php` — text domain, editor styles, block-style registration, skip-link.
- Template parts: `parts/header.html`, `parts/footer.html`.
- Templates: `templates/index.html`, `templates/single.html`, `templates/404.html`,
  `templates/page.html`, `templates/page-wide.html`, `templates/page-blank.html`,
  `templates/front-page.html`, `templates/home.html`, plus a
  `templates/page-<slug>.html` for every planned page (About, Menu/Services,
  Blog, Contact).
- Patterns: `patterns/hero-features.php` (opening pattern) and
  `patterns/contact-hours.php` (contact + hours).
- i18n: `languages/<textdomain>.pot` and, for Slovak briefs, `languages/sk_SK.po`.
- `screenshot.svg` (paper-and-ink theme card).
- `index.php` (silence-is-golden), `readme.txt`, `INSTALL.md`.

Install the ZIP through **Appearance → Themes → Add New → Upload Theme**.

## Studio UI

- **Brief pane** – free-form SK/EN text. Language and site kind (café, restaurant,
  portfolio, shop, blog, agency, personal, generic) are detected deterministically.
- **Design system** – five palette presets, plus a custom primary color and a
  radius slider. Every preset ships WCAG-AA-compliant defaults.
- **Multi-page tabs** – live iframe preview switches between Home / About /
  Menu · Services · Portfolio / Blog / Contact without a page refresh.
- **Files** – full source browser (theme.json, block templates, PHP, i18n, patterns).
- **Audit** – SEO + a11y checks with actionable hints and a contrast table.
- **Download ZIP** – one click, no server needed.

## Architecture

```
src/lib/wp/
  types.ts            – shared types (SiteBrief, DesignSystem, PageDef, WpTheme)
  brief.ts            – deterministic SK/EN brief parser
  design-system.ts    – palettes, typography, spacing, WCAG helpers
  pages.ts            – multi-page site plan with SK/EN copy
  theme-json.ts       – theme.json (schema v3) builder
  block-templates.ts  – Gutenberg block markup for parts + templates + patterns
  php-files.ts        – style.css, functions.php, readme.txt, screenshot.svg
  i18n.ts             – POT + SK PO
  seo-a11y.ts         – deterministic SEO + accessibility audit
  preview-html.ts     – static multi-page HTML preview for the iframe
  zip.ts              – dependency-free STORE-mode ZIP writer
  index.ts            – generateWpTheme(brief, options) + bundleThemeZip(theme)

src/components/studio/wp/WpStudio.tsx  – Studio UI
src/routes/studio.wp.tsx               – TanStack route mount
```

The generator has **zero AI dependency**. When you add an API key later, the
LLM only fills in richer copy for the hero, features, and testimonials — the
structure, WP scaffolding, SEO, and a11y are guaranteed by the deterministic
pipeline above.

## Scripts

- `scripts/wp-smoke.mjs` – renders a sample brief and prints stats.
- `scripts/wp-audit-all.mjs` – runs SEO + a11y for every palette preset.
- `scripts/wp-inspect.mjs` – dumps the full audit for one brief.
- `scripts/wp-sample-artifacts.mjs` – writes a sample ZIP + preview HTML
  to the workspace (useful for local review or manual QA).

All scripts run via `npx tsx scripts/<name>.mjs`.
