/**
 * Static HTML preview.
 *
 * Renders the multi-page site plan into a single self-contained HTML
 * document that can drop into the studio's existing sandboxed iframe.
 * The preview reuses the same design tokens the FSE theme.json produces,
 * so what you see in the iframe matches what a WP install would show
 * after theme activation. Tab-style page switcher is inline JS, no libs.
 */

import type { DesignSystem, PageDef, PageSection, SiteBrief } from "./types.ts";
import { spaceScaleRem, typeScaleRem } from "./design-system.ts";
import { buildFaviconDataUri } from "./favicon.ts";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function styleBlock(design: DesignSystem): string {
  const p = design.palette;
  const t = typeScaleRem(design.typography);
  const s = spaceScaleRem(design.spacing);
  return `<style>
    :root {
      --bg: ${p.background};
      --surface: ${p.surface};
      --ink: ${p.ink};
      --muted: ${p.muted};
      --primary: ${p.primary};
      --primary-contrast: ${p.primaryContrast};
      --accent: ${p.accent};
      --border: ${p.border};
      --radius: ${design.radius}px;
      --container: ${design.spacing.containerMaxWidth}px;
      --heading-family: ${design.typography.headingStack};
      --body-family: ${design.typography.bodyStack};
      --fs-sm: ${t.sm};
      --fs-base: ${t.base};
      --fs-lg: ${t.lg};
      --fs-xl: ${t.xl};
      --fs-xxl: ${t.xxl};
      --fs-hero: ${t.hero};
      --sp-1: ${s["1"]};
      --sp-2: ${s["2"]};
      --sp-3: ${s["3"]};
      --sp-4: ${s["4"]};
      --sp-5: ${s["5"]};
      --sp-6: ${s["6"]};
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: var(--body-family); font-size: var(--fs-base); line-height: 1.65; }
    a { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
    a:hover { color: var(--accent); }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
    h1, h2, h3, h4 { font-family: var(--heading-family); font-weight: 600; line-height: 1.15; margin: 0 0 var(--sp-2); letter-spacing: -0.005em; color: var(--ink); }
    h1 { font-size: var(--fs-hero); }
    h2 { font-size: var(--fs-xxl); }
    h3 { font-size: var(--fs-xl); }
    p { margin: 0 0 var(--sp-2); }
    p.kicker { text-transform: uppercase; letter-spacing: 0.14em; font-size: var(--fs-sm); color: var(--primary); margin-bottom: var(--sp-2); }
    header.site {
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      position: sticky; top: 0; z-index: 5;
      backdrop-filter: saturate(120%) blur(6px);
    }
    header.site .wrap { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-2) var(--sp-3); }
    header.site .brand { font-family: var(--heading-family); font-size: var(--fs-lg); font-weight: 600; }
    header.site nav { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
    header.site nav button { background: transparent; border: 0; color: var(--ink); font: inherit; padding: 0.5rem 0.75rem; border-radius: var(--radius); cursor: pointer; }
    header.site nav button[aria-current="page"] { background: var(--surface); color: var(--primary); font-weight: 600; }
    main { min-height: 60vh; }
    section.block { padding: var(--sp-4) var(--sp-3); }
    section.block .wrap { max-width: var(--container); margin: 0 auto; }
    section.block.full { background: var(--surface); }
    .hero { padding: var(--sp-6) var(--sp-3); background: var(--bg); }
    .hero .wrap { max-width: var(--container); margin: 0 auto; }
    .hero h1 { max-width: 18ch; margin-bottom: var(--sp-3); }
    .hero p.lede { font-size: var(--fs-lg); color: var(--muted); max-width: 60ch; }
    .btn { display: inline-flex; align-items: center; gap: .4rem; padding: .8rem 1.15rem; border-radius: var(--radius); background: var(--primary); color: var(--primary-contrast); text-decoration: none; font-weight: 600; }
    .btn:hover { background: var(--accent); color: var(--primary-contrast); }
    .grid { display: grid; gap: var(--sp-3); }
    .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (max-width: 800px) { .grid-3 { grid-template-columns: 1fr; } }
    .card { background: var(--surface); padding: var(--sp-3); border: 1px solid var(--border); border-radius: var(--radius); }
    .card h3 { margin: 0 0 var(--sp-1); font-size: var(--fs-lg); }
    .card p { margin: 0; color: var(--muted); }
    .price-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); padding: .3rem 0; border-bottom: 1px dashed var(--border); }
    .price-row:last-child { border-bottom: 0; }
    .price-row em { font-style: italic; color: var(--muted); font-size: var(--fs-sm); }
    .quote { border-left: 3px solid var(--border); padding-left: var(--sp-2); margin: var(--sp-2) 0; font-style: italic; color: var(--muted); }
    .quote cite { display: block; margin-top: .25rem; font-style: normal; color: var(--ink); font-weight: 600; }
    .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-2); }
    @media (max-width: 800px) { .gallery { grid-template-columns: 1fr; } }
    .gallery figure { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); aspect-ratio: 4/3; display: flex; align-items: flex-end; padding: var(--sp-2); margin: 0; color: var(--muted); }
    footer.site { border-top: 1px solid var(--border); padding: var(--sp-4) var(--sp-3); background: var(--surface); color: var(--muted); font-size: var(--fs-sm); }
    .page { display: none; }
    .page[data-active="true"] { display: block; }
    .contact-lines { line-height: 1.9; font-size: var(--fs-lg); }
    .post { border-top: 1px solid var(--border); padding: var(--sp-2) 0; }
    .post h3 { margin: 0; }
    .post time { display: block; color: var(--muted); font-size: var(--fs-sm); margin-top: .25rem; }
    .badge { display: inline-block; padding: .25rem .55rem; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); font-size: var(--fs-sm); color: var(--muted); }
  </style>`;
}

function renderSection(section: PageSection): string {
  switch (section.type) {
    case "hero":
      return `<section class="hero"><div class="wrap">
        ${section.kicker ? `<p class="kicker">${esc(section.kicker)}</p>` : ""}
        <h1>${esc(section.heading)}</h1>
        <p class="lede">${esc(section.lede)}</p>
        ${section.cta ? `<p><a class="btn" href="#" role="button">${esc(section.cta)} →</a></p>` : ""}
      </div></section>`;
    case "features": {
      const items = section.items
        .map((it) => `<div class="card"><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></div>`)
        .join("");
      return `<section class="block"><div class="wrap">
        <h2>${esc(section.heading)}</h2>
        <div class="grid grid-3">${items}</div>
      </div></section>`;
    }
    case "menu": {
      const groups = section.groups
        .map(
          (g) => `<div><h3>${esc(g.name)}</h3>${g.items
            .map(
              (it) =>
                `<div class="price-row"><span><strong>${esc(it.name)}</strong>${it.note ? `<br/><em>${esc(it.note)}</em>` : ""}</span><span>${esc(it.price)}</span></div>`,
            )
            .join("")}</div>`,
        )
        .join("");
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2><div class="grid grid-3">${groups}</div></div></section>`;
    }
    case "hours": {
      const rows = section.rows
        .map(
          (r) =>
            `<div class="price-row"><strong>${esc(r.day)}</strong><span>${esc(r.hours)}</span></div>`,
        )
        .join("");
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2>${rows}</div></section>`;
    }
    case "gallery": {
      const figs = section.captions
        .map((c) => `<figure><figcaption>${esc(c)}</figcaption></figure>`)
        .join("");
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2><div class="gallery">${figs}</div></div></section>`;
    }
    case "testimonials": {
      const q = section.quotes
        .map((it) => `<blockquote class="quote"><p>${esc(it.quote)}</p><cite>— ${esc(it.author)}</cite></blockquote>`)
        .join("");
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2>${q}</div></section>`;
    }
    case "cta":
      return `<section class="block full"><div class="wrap"><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p><p><a class="btn" href="#" role="button">${esc(section.label)} →</a></p></div></section>`;
    case "contact":
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2><p class="contact-lines"><strong>${esc(section.address)}</strong><br/><a href="mailto:${esc(section.email)}">${esc(section.email)}</a><br/>${esc(section.phone)}</p></div></section>`;
    case "prose":
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p></div></section>`;
    case "posts": {
      const items = Array.from({ length: section.count }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i * 5);
        return `<article class="post"><h3>Draft note ${i + 1}</h3><time>${d.toISOString().slice(0, 10)}</time><p>Lorem — poznámka bude nahradená obsahom v WP editore.</p></article>`;
      }).join("");
      return `<section class="block"><div class="wrap"><h2>${esc(section.heading)}</h2>${items}</div></section>`;
    }
  }
}

function renderPage(page: PageDef): string {
  const active = page.id === "home";
  return `<div class="page" data-page="${esc(page.id)}" data-active="${active}">${page.sections.map(renderSection).join("")}</div>`;
}

export function renderPreviewHtml(brief: SiteBrief, design: DesignSystem, pages: PageDef[]): string {
  const nav = pages
    .map(
      (p) =>
        `<button data-target="${esc(p.id)}"${p.id === "home" ? ' aria-current="page"' : ""}>${esc(p.title)}</button>`,
    )
    .join("");
  const body = pages.map(renderPage).join("\n");
  const langAttr = brief.locale;
  const description = esc(brief.description);
  const structuredData: Record<string, unknown> =
    brief.kind === "cafe" || brief.kind === "restaurant"
      ? {
          "@context": "https://schema.org",
          "@type": brief.kind === "cafe" ? "CafeOrCoffeeShop" : "Restaurant",
          name: brief.name,
          description: brief.description,
          email: brief.contact.email,
          telephone: brief.contact.phone,
          address: brief.contact.address ? { "@type": "PostalAddress", streetAddress: brief.contact.address } : undefined,
        }
      : {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brief.name,
          description: brief.description,
          email: brief.contact.email,
        };
  return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(brief.name)} — ${esc(brief.tagline)}</title>
<meta name="description" content="${description}"/>
<meta property="og:title" content="${esc(brief.name)}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:type" content="website"/>
<meta name="theme-color" content="${design.palette.background}"/>
<link rel="icon" href="${buildFaviconDataUri(design.palette)}" type="image/svg+xml"/>
<script type="application/ld+json">${JSON.stringify(structuredData)}</script>
${styleBlock(design)}
</head>
<body>
<a class="skip-link" href="#main" style="position:absolute;left:-9999px" onfocus="this.style.left='1rem';this.style.top='1rem'" onblur="this.style.left='-9999px'">${langAttr === "sk" ? "Preskočiť na obsah" : "Skip to content"}</a>
<header class="site" role="banner"><div class="wrap"><div class="brand">${esc(brief.name)}</div><nav aria-label="${langAttr === "sk" ? "Hlavná navigácia" : "Primary"}">${nav}</nav></div></header>
<main id="main" role="main">${body}</main>
<footer class="site" role="contentinfo"><div class="wrap">© ${new Date().getFullYear()} ${esc(brief.name)}. ${langAttr === "sk" ? "Postavené s pokorou." : "Built with care."}</div></footer>
<script>
(function(){
  var buttons = document.querySelectorAll('header.site nav button');
  var pages = document.querySelectorAll('.page');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = btn.getAttribute('data-target');
      buttons.forEach(function(b){ b.removeAttribute('aria-current'); });
      btn.setAttribute('aria-current', 'page');
      pages.forEach(function(p){
        p.setAttribute('data-active', p.getAttribute('data-page') === target ? 'true' : 'false');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
})();
</script>
</body>
</html>`;
}
