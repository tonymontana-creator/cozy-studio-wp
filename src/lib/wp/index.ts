/**
 * Cozy Studio → WordPress FSE theme generator (public entry point).
 *
 * `generateWpTheme` is the single call the UI needs: it parses the brief,
 * plans the pages, builds theme.json, block templates, PHP scaffolding,
 * i18n files, SEO/a11y reports, a rich static preview, and packs everything
 * into a `WpTheme` object that the UI can either preview live or ship as
 * an installable ZIP through `bundleThemeZip`.
 */

import { slug, parseBrief } from "./brief";
import {
  DESIGN_PRESETS,
  getDesignPreset,
} from "./design-system";
import { planPages } from "./pages";
import { buildThemeJson } from "./theme-json";
import {
  footerHtml,
  headerHtml,
  heroFeaturesPattern,
  indexTemplate,
  pageTemplateHtml,
  singleTemplate,
  siteTemplate,
} from "./block-templates";
import {
  functionsPhp,
  indexPhp,
  readmeTxt,
  screenshotSvg,
  styleCss,
} from "./php-files";
import { potFile, skPoFile } from "./i18n";
import { auditA11y, auditSeo } from "./seo-a11y";
import { renderPreviewHtml } from "./preview-html";
import { buildZip, type ZipEntry } from "./zip";
import type {
  DesignSystem,
  PageDef,
  SiteBrief,
  WpFile,
  WpTheme,
} from "./types";

export type GenerateOptions = {
  designPresetId?: string;
  customDesign?: Partial<DesignSystem>;
  version?: string;
  pagesOverride?: PageDef[];
};

const VERSION = "1.0.0";

function mergeDesign(preset: DesignSystem, custom?: Partial<DesignSystem>): DesignSystem {
  if (!custom) return preset;
  return {
    ...preset,
    ...custom,
    palette: { ...preset.palette, ...(custom.palette ?? {}) },
    typography: { ...preset.typography, ...(custom.typography ?? {}) },
    spacing: { ...preset.spacing, ...(custom.spacing ?? {}) },
  };
}

function buildFiles(
  brief: SiteBrief,
  design: DesignSystem,
  pages: PageDef[],
  textDomain: string,
  version: string,
): WpFile[] {
  const files: WpFile[] = [];
  const push = (path: string, content: string) => files.push({ path, content });

  push("style.css", styleCss(brief, design, textDomain, version));
  push("theme.json", JSON.stringify(buildThemeJson(design, brief), null, 2));
  push("functions.php", functionsPhp(textDomain));
  push("index.php", indexPhp());
  push("readme.txt", readmeTxt(brief, textDomain, version));
  push("screenshot.svg", screenshotSvg(brief, design));

  push("parts/header.html", headerHtml(brief, pages));
  push("parts/footer.html", footerHtml(brief));

  push("templates/index.html", indexTemplate(brief));
  push("templates/single.html", singleTemplate(brief));
  push("templates/404.html", siteTemplate(pageTemplateHtml({
    id: "home",
    slug: "404",
    title: "404",
    description: "",
    sections: [
      { type: "prose", heading: brief.locale === "sk" ? "Stránka sa nenašla" : "Page not found", body: brief.locale === "sk" ? "Skúste hlavnú stránku alebo napíšte." : "Try the home page or write to us." },
    ],
  })));
  push("templates/page-wide.html", siteTemplate(pageTemplateHtml({
    id: "home",
    slug: "wide",
    title: "Wide",
    description: "",
    sections: [
      { type: "prose", heading: brief.locale === "sk" ? "Široká stránka" : "Wide page", body: brief.locale === "sk" ? "Priestor pre dlhší text alebo prezentáciu." : "Space for long-form or presentation content." },
    ],
  })));
  push("templates/page-blank.html", siteTemplate(""));

  for (const page of pages) {
    if (page.id === "home") {
      push("templates/front-page.html", siteTemplate(pageTemplateHtml(page)));
      push("templates/home.html", siteTemplate(pageTemplateHtml(page)));
    } else {
      push(`templates/page-${page.slug}.html`, siteTemplate(pageTemplateHtml(page)));
    }
  }
  // Default `page.html` fallback
  push(
    "templates/page.html",
    `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
<!-- wp:post-title {"level":1} /-->
<!-- wp:post-content /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->`,
  );

  const heroPattern = heroFeaturesPattern(brief, pages);
  if (heroPattern) {
    push(
      "patterns/hero-features.php",
      `<?php
/**
 * Title: ${brief.locale === "sk" ? "Hero + tri prínosy" : "Hero + three benefits"}
 * Slug: ${textDomain}/hero-features
 * Categories: ${textDomain}
 * Description: ${brief.locale === "sk" ? "Úvodná sekcia s hlavičkou a troma stĺpcami." : "Opening hero paired with a three-column feature grid."}
 */
?>
${heroPattern}`,
    );
  }

  // Contact pattern
  const contactPage = pages.find((p) => p.id === "contact");
  if (contactPage) {
    push(
      "patterns/contact-hours.php",
      `<?php
/**
 * Title: ${brief.locale === "sk" ? "Kontakt + hodiny" : "Contact + hours"}
 * Slug: ${textDomain}/contact-hours
 * Categories: ${textDomain}
 * Description: ${brief.locale === "sk" ? "Kontakt so sekciou otváracích hodín." : "Contact block with an hours sidebar."}
 */
?>
${pageTemplateHtml(contactPage)}`,
    );
  }

  // i18n
  push(`languages/${textDomain}.pot`, potFile(brief, textDomain));
  if (brief.locale === "sk") {
    push(`languages/sk_SK.po`, skPoFile(brief, textDomain));
  }

  // theme instructions
  push(
    "INSTALL.md",
    `# ${brief.name} — install\n\n1. Stiahnite ZIP.\n2. WordPress admin → Appearance → Themes → Add New → Upload Theme.\n3. Vyberte ZIP, kliknite Install Now, potom Activate.\n4. Otvorte Appearance → Editor (Site Editor) — všetky bloky sú editovateľné.\n\nGenerated by Cozy Studio (${version}).`,
  );

  return files;
}

export function generateWpTheme(rawBrief: string, options: GenerateOptions = {}): WpTheme {
  const brief = parseBrief(rawBrief);
  const preset = getDesignPreset(options.designPresetId ?? "warm-paper");
  const design = mergeDesign(preset, options.customDesign);
  const pages = options.pagesOverride ?? planPages(brief);
  const textDomain = slug(brief.name);
  const version = options.version ?? VERSION;
  const files = buildFiles(brief, design, pages, textDomain, version);
  const previewHtml = renderPreviewHtml(brief, design, pages);
  const seo = auditSeo(brief, pages);
  const a11y = auditA11y(design, pages);
  return {
    slug: textDomain,
    name: brief.name,
    version,
    brief,
    design,
    pages,
    files,
    previewHtml,
    seo,
    a11y,
  };
}

export function bundleThemeZip(theme: WpTheme): Blob {
  const entries: ZipEntry[] = theme.files.map((f) => ({
    path: `${theme.slug}/${f.path}`,
    content: f.content,
  }));
  return buildZip(entries);
}

export function listDesignPresets(): { id: string; label: string; palette: DesignSystem["palette"] }[] {
  return Object.entries(DESIGN_PRESETS).map(([id, ds]) => ({
    id,
    label: ds.name,
    palette: ds.palette,
  }));
}

export { parseBrief, planPages, auditSeo, auditA11y, renderPreviewHtml };
export type { WpTheme, SiteBrief, DesignSystem, PageDef };
