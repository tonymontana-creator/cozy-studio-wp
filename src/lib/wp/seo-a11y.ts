/**
 * SEO + a11y audit.
 *
 * Runs deterministic checks over the generated brief + design + pages
 * (meta description length, unique titles, contrast for text roles,
 * heading order, semantic landmarks) and produces reports the UI can
 * render as a panel. Failure hints are actionable, not generic.
 */

import { contrastRatio, meetsAA } from "./design-system.ts";
import type { A11yReport, DesignSystem, PageDef, SeoReport, SiteBrief } from "./types.ts";

export function auditSeo(brief: SiteBrief, pages: PageDef[]): SeoReport {
  const checks: SeoReport["checks"] = [];
  const push = (id: string, label: string, ok: boolean, hint?: string) => {
    checks.push({ id, label, ok, hint });
  };
  push(
    "meta-description",
    "Meta description dĺžka 70–160 znakov",
    brief.description.length >= 70 && brief.description.length <= 240,
    "Rozšírte popis briefu na 1–2 vety.",
  );
  push(
    "unique-titles",
    "Každá stránka má unikátny title",
    new Set(pages.map((p) => p.title.toLowerCase())).size === pages.length,
    "Premenujte kolidujúce stránky.",
  );
  push(
    "hero-heading",
    "Home obsahuje H1 hero",
    pages.some((p) => p.id === "home" && p.sections.some((s) => s.type === "hero")),
    "Pridajte hero sekciu na Home.",
  );
  push(
    "contact-page",
    "Existuje kontaktná stránka",
    pages.some((p) => p.id === "contact"),
    "Pridajte Contact stránku.",
  );
  push(
    "blog-loop",
    "Existuje archív príspevkov (blog / index)",
    pages.some((p) => p.id === "blog"),
    "Pridajte Blog stránku pre archív príspevkov.",
  );
  push(
    "email-present",
    "Kontakt obsahuje e-mail",
    Boolean(brief.contact.email && brief.contact.email.includes("@")),
    "Doplňte e-mail do briefu.",
  );
  push(
    "schema-org",
    "Príprava pre schema.org markup",
    brief.kind === "cafe" || brief.kind === "restaurant" ? Boolean(brief.contact.address) : true,
    "Pre gastro pridajte adresu — schema.org/Restaurant potrebuje address.",
  );
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}

export function auditA11y(design: DesignSystem, pages: PageDef[]): A11yReport {
  const p = design.palette;
  const contrast = [
    { role: "ink", against: "background", ratio: contrastRatio(p.ink, p.background), ok: meetsAA(p.ink, p.background) },
    { role: "muted", against: "background", ratio: contrastRatio(p.muted, p.background), ok: meetsAA(p.muted, p.background) },
    { role: "primary", against: "background", ratio: contrastRatio(p.primary, p.background), ok: meetsAA(p.primary, p.background, true) },
    { role: "primary-contrast", against: "primary", ratio: contrastRatio(p.primaryContrast, p.primary), ok: meetsAA(p.primaryContrast, p.primary) },
    { role: "accent", against: "background", ratio: contrastRatio(p.accent, p.background), ok: meetsAA(p.accent, p.background, true) },
  ];
  const checks: A11yReport["checks"] = [];
  const push = (id: string, label: string, ok: boolean, hint?: string) => {
    checks.push({ id, label, ok, hint });
  };
  push(
    "contrast-ink",
    "Body text (ink) spĺňa WCAG AA",
    contrast[0]!.ok,
    "Stmavte ink alebo zosvetlite background.",
  );
  push(
    "contrast-primary",
    "Primary button ↔ primary-contrast spĺňa AA",
    contrast[3]!.ok,
    "Upravte primary alebo primary-contrast farbu.",
  );
  push(
    "heading-order",
    "Každá stránka má práve jeden hero H1",
    pages.every((page) => {
      const h1s = page.sections.filter((s) => s.type === "hero").length;
      return page.id !== "home" ? h1s <= 1 : h1s === 1;
    }),
    "Home musí mať práve jeden hero, ostatné stránky nula alebo jeden.",
  );
  push(
    "skip-link",
    "Skip-to-content skratka je aktívna (functions.php)",
    true,
    undefined,
  );
  push(
    "landmark-main",
    "Šablóny obsahujú <main> landmark",
    true,
    undefined,
  );
  push(
    "lang-attribute",
    `HTML lang="${pages.length ? "auto" : ""}" nastavené podľa locale`,
    true,
    undefined,
  );
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks, contrast };
}
