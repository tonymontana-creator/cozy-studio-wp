/**
 * Gutenberg block markup for FSE templates and template-parts.
 *
 * WordPress FSE stores site templates as `.html` files whose content is the
 * serialized Gutenberg block comment syntax. This module turns structured
 * `PageDef` sections into that markup, so the ZIP contains real editable
 * blocks — not raw HTML wrappers. Everything is escaped safely and uses
 * `hasSpacing / align="full"` conventions that match the theme.json above.
 */

import type { PageDef, PageSection, SiteBrief } from "./types";

/* ---------------- Encoding helpers ---------------- */

function esc(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attrs(obj: Record<string, unknown> | null): string {
  if (!obj || Object.keys(obj).length === 0) return "";
  return " " + JSON.stringify(obj);
}

function block(name: string, attributes: Record<string, unknown> | null, inner: string): string {
  const a = attrs(attributes);
  if (!inner) return `<!-- wp:${name}${a} /-->\n`;
  return `<!-- wp:${name}${a} -->\n${inner}\n<!-- /wp:${name} -->\n`;
}

/* ---------------- Section renderers ---------------- */

function renderHero(s: Extract<PageSection, { type: "hero" }>): string {
  const heading = block(
    "heading",
    { level: 1, textColor: "ink", fontSize: "hero" },
    `<h1 class="wp-block-heading has-ink-color has-text-color has-hero-font-size">${esc(s.heading)}</h1>`,
  );
  const kicker = block(
    "paragraph",
    { textColor: "primary", fontSize: "small" },
    `<p class="has-primary-color has-text-color has-small-font-size" style="text-transform:uppercase;letter-spacing:0.12em">${esc(s.kicker)}</p>`,
  );
  const lede = block(
    "paragraph",
    { textColor: "muted", fontSize: "large" },
    `<p class="has-muted-color has-text-color has-large-font-size">${esc(s.lede)}</p>`,
  );
  const cta = s.cta
    ? block(
        "buttons",
        null,
        block(
          "button",
          { backgroundColor: "primary", textColor: "primary-contrast" },
          `<div class="wp-block-button"><a class="wp-block-button__link has-primary-contrast-color has-primary-background-color has-text-color has-background wp-element-button">${esc(s.cta)}</a></div>`,
        ),
      )
    : "";
  const inner = kicker + heading + lede + cta;
  return block(
    "group",
    {
      tagName: "section",
      align: "full",
      style: {
        spacing: {
          padding: {
            top: "var:preset|spacing|60",
            bottom: "var:preset|spacing|60",
            left: "var:preset|spacing|40",
            right: "var:preset|spacing|40",
          },
        },
      },
      backgroundColor: "background",
      layout: { type: "constrained" },
    },
    inner,
  );
}

function renderFeatures(s: Extract<PageSection, { type: "features" }>): string {
  const heading = block(
    "heading",
    { level: 2 },
    `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`,
  );
  const cols = s.items
    .map((item) =>
      block(
        "column",
        null,
        block("heading", { level: 3 }, `<h3 class="wp-block-heading">${esc(item.title)}</h3>`) +
          block("paragraph", null, `<p>${esc(item.body)}</p>`),
      ),
    )
    .join("");
  const columns = block("columns", { align: "wide" }, cols);
  return block(
    "group",
    {
      tagName: "section",
      align: "full",
      style: { spacing: { padding: { top: "var:preset|spacing|50", bottom: "var:preset|spacing|50" } } },
      layout: { type: "constrained" },
    },
    heading + columns,
  );
}

function renderMenu(s: Extract<PageSection, { type: "menu" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const groups = s.groups
    .map((g) => {
      const items = g.items
        .map(
          (it) =>
            block(
              "paragraph",
              null,
              `<p><strong>${esc(it.name)}</strong> <span style="float:right">${esc(it.price)}</span>${it.note ? `<br/><em>${esc(it.note)}</em>` : ""}</p>`,
            ),
        )
        .join("");
      return block("group", { tagName: "div" }, block("heading", { level: 3 }, `<h3 class="wp-block-heading">${esc(g.name)}</h3>`) + items);
    })
    .join("");
  return block(
    "group",
    { tagName: "section", align: "full", layout: { type: "constrained" } },
    heading + groups,
  );
}

function renderHours(s: Extract<PageSection, { type: "hours" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const rows = s.rows
    .map(
      (r) =>
        block(
          "paragraph",
          null,
          `<p><strong>${esc(r.day)}</strong> <span style="float:right">${esc(r.hours)}</span></p>`,
        ),
    )
    .join("");
  return block(
    "group",
    { tagName: "section", align: "wide", layout: { type: "constrained" } },
    heading + rows,
  );
}

function renderGallery(s: Extract<PageSection, { type: "gallery" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const cards = s.captions
    .map(
      (c) =>
        block(
          "column",
          null,
          block("group", { tagName: "figure", style: { border: { radius: "8px" } }, backgroundColor: "surface" }, block("paragraph", null, `<p>${esc(c)}</p>`)),
        ),
    )
    .join("");
  return block(
    "group",
    { tagName: "section", align: "full", layout: { type: "constrained" } },
    heading + block("columns", { align: "wide" }, cards),
  );
}

function renderTestimonials(s: Extract<PageSection, { type: "testimonials" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const quotes = s.quotes
    .map((q) =>
      block(
        "quote",
        null,
        `<blockquote class="wp-block-quote"><p>${esc(q.quote)}</p><cite>${esc(q.author)}</cite></blockquote>`,
      ),
    )
    .join("");
  return block(
    "group",
    { tagName: "section", align: "wide", layout: { type: "constrained" } },
    heading + quotes,
  );
}

function renderCta(s: Extract<PageSection, { type: "cta" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const body = block("paragraph", { fontSize: "large" }, `<p class="has-large-font-size">${esc(s.body)}</p>`);
  const cta = block(
    "buttons",
    null,
    block(
      "button",
      { backgroundColor: "primary", textColor: "primary-contrast" },
      `<div class="wp-block-button"><a class="wp-block-button__link has-primary-contrast-color has-primary-background-color has-text-color has-background wp-element-button">${esc(s.label)}</a></div>`,
    ),
  );
  return block(
    "group",
    {
      tagName: "section",
      align: "full",
      backgroundColor: "surface",
      style: { spacing: { padding: { top: "var:preset|spacing|50", bottom: "var:preset|spacing|50" } } },
      layout: { type: "constrained" },
    },
    heading + body + cta,
  );
}

function renderContact(s: Extract<PageSection, { type: "contact" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const lines = block(
    "paragraph",
    null,
    `<p><strong>${esc(s.address)}</strong><br/><a href="mailto:${esc(s.email)}">${esc(s.email)}</a><br/>${esc(s.phone)}</p>`,
  );
  return block(
    "group",
    { tagName: "section", align: "wide", layout: { type: "constrained" } },
    heading + lines,
  );
}

function renderProse(s: Extract<PageSection, { type: "prose" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const body = block("paragraph", null, `<p>${esc(s.body)}</p>`);
  return block(
    "group",
    { tagName: "section", align: "wide", layout: { type: "constrained" } },
    heading + body,
  );
}

function renderPosts(s: Extract<PageSection, { type: "posts" }>): string {
  const heading = block("heading", { level: 2 }, `<h2 class="wp-block-heading">${esc(s.heading)}</h2>`);
  const list = block(
    "query",
    { queryId: 0, query: { perPage: s.count, postType: "post", inherit: false } },
    block(
      "post-template",
      null,
      block("post-title", { level: 3, isLink: true }, "") +
        block("post-date", null, "") +
        block("post-excerpt", null, ""),
    ),
  );
  return block(
    "group",
    { tagName: "section", align: "wide", layout: { type: "constrained" } },
    heading + list,
  );
}

function renderSection(section: PageSection): string {
  switch (section.type) {
    case "hero": return renderHero(section);
    case "features": return renderFeatures(section);
    case "menu": return renderMenu(section);
    case "hours": return renderHours(section);
    case "gallery": return renderGallery(section);
    case "testimonials": return renderTestimonials(section);
    case "cta": return renderCta(section);
    case "contact": return renderContact(section);
    case "prose": return renderProse(section);
    case "posts": return renderPosts(section);
  }
}

/* ---------------- Template parts ---------------- */

export function headerHtml(brief: SiteBrief, pages: PageDef[]): string {
  const nav = pages
    .filter((p) => p.id !== "home")
    .map((p) => `<!-- wp:navigation-link {"label":"${esc(p.title)}","url":"/${esc(p.slug)}/","kind":"custom"} /-->`)
    .join("\n");
  const homeLink = `<!-- wp:navigation-link {"label":"${brief.locale === "sk" ? "Domov" : "Home"}","url":"/","kind":"custom"} /-->`;
  return `<!-- wp:group {"tagName":"header","align":"full","backgroundColor":"background","style":{"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}},"layout":{"type":"constrained"}} -->
<header class="wp-block-group alignfull has-background-background-color has-background" style="padding:var(--wp--preset--spacing--20) var(--wp--preset--spacing--30)">
<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group">
<!-- wp:site-title {"level":0} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex"}} -->
${homeLink}
${nav}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</header>
<!-- /wp:group -->`;
}

export function footerHtml(brief: SiteBrief): string {
  const year = new Date().getFullYear();
  return `<!-- wp:group {"tagName":"footer","align":"full","backgroundColor":"surface","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}},"layout":{"type":"constrained"}} -->
<footer class="wp-block-group alignfull has-surface-background-color has-background" style="padding:var(--wp--preset--spacing--40) var(--wp--preset--spacing--30)">
<!-- wp:paragraph {"textColor":"muted","fontSize":"small"} -->
<p class="has-muted-color has-text-color has-small-font-size">© ${year} ${esc(brief.name)}. ${brief.locale === "sk" ? "Postavené s pokorou." : "Built with care."}</p>
<!-- /wp:paragraph -->
</footer>
<!-- /wp:group -->`;
}

/* ---------------- Page template (all block content) ---------------- */

export function pageTemplateHtml(page: PageDef): string {
  return page.sections.map(renderSection).join("\n");
}

/* ---------------- Site templates ---------------- */

export function siteTemplate(pageBody: string): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","align":"full","layout":{"type":"constrained"}} -->
<main class="wp-block-group alignfull">
${pageBody}
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`;
}

export function singleTemplate(brief: SiteBrief): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
<!-- wp:post-title {"level":1} /-->
<!-- wp:post-date {"textColor":"muted","fontSize":"small"} /-->
<!-- wp:post-featured-image /-->
<!-- wp:post-content /-->
<!-- wp:post-terms {"term":"category"} /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`;
  void brief;
}

export function indexTemplate(brief: SiteBrief): string {
  const label = brief.locale === "sk" ? "Posledné príspevky" : "Latest posts";
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">${esc(label)}</h1><!-- /wp:heading -->
<!-- wp:query {"queryId":0,"query":{"perPage":8,"postType":"post","inherit":true}} -->
<!-- wp:post-template -->
<!-- wp:post-title {"level":2,"isLink":true} /-->
<!-- wp:post-date {"textColor":"muted","fontSize":"small"} /-->
<!-- wp:post-excerpt /-->
<!-- /wp:post-template -->
<!-- /wp:query -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`;
}

/* ---------------- Pattern: Hero + Features (reusable) ---------------- */

export function heroFeaturesPattern(brief: SiteBrief, pages: PageDef[]): string {
  const home = pages.find((p) => p.id === "home");
  if (!home) return "";
  const hero = home.sections.find((s) => s.type === "hero");
  const features = home.sections.find((s) => s.type === "features");
  if (!hero || !features) return "";
  return renderSection(hero) + renderSection(features);
  void brief;
}

export { renderSection };
