/**
 * theme.json builder for WordPress FSE themes.
 *
 * Serializes a `DesignSystem` into the schema WordPress expects
 * (settings.color.palette, typography.fontSizes/families, spacing.spacingSizes,
 * layout, blocks styles). Also emits a `styles` block that mirrors the palette
 * onto core block elements so a fresh install looks correct out of the box.
 */

import type { DesignSystem, SiteBrief } from "./types.ts";
import { spaceScaleRem, typeScaleRem } from "./design-system.ts";

export function buildThemeJson(design: DesignSystem, brief: SiteBrief): object {
  const t = typeScaleRem(design.typography);
  const s = spaceScaleRem(design.spacing);
  const p = design.palette;
  return {
    $schema: "https://schemas.wp.org/trunk/theme.json",
    version: 3,
    settings: {
      appearanceTools: true,
      layout: {
        contentSize: `${Math.min(680, design.spacing.containerMaxWidth - 240)}px`,
        wideSize: `${design.spacing.containerMaxWidth}px`,
      },
      color: {
        defaultPalette: false,
        defaultGradients: false,
        defaultDuotone: false,
        palette: [
          { slug: "background", name: "Background", color: p.background },
          { slug: "surface", name: "Surface", color: p.surface },
          { slug: "ink", name: "Ink", color: p.ink },
          { slug: "muted", name: "Muted", color: p.muted },
          { slug: "primary", name: "Primary", color: p.primary },
          { slug: "primary-contrast", name: "Primary contrast", color: p.primaryContrast },
          { slug: "accent", name: "Accent", color: p.accent },
          { slug: "border", name: "Border", color: p.border },
        ],
      },
      typography: {
        fluid: true,
        fontFamilies: [
          {
            slug: "heading",
            name: design.typography.headingFamily,
            fontFamily: design.typography.headingStack,
          },
          {
            slug: "body",
            name: design.typography.bodyFamily,
            fontFamily: design.typography.bodyStack,
          },
        ],
        fontSizes: [
          { slug: "small", name: "Small", size: t.sm },
          { slug: "medium", name: "Medium", size: t.base },
          { slug: "large", name: "Large", size: t.lg },
          { slug: "x-large", name: "Extra large", size: t.xl },
          { slug: "xx-large", name: "Display", size: t.xxl },
          { slug: "hero", name: "Hero", size: t.hero },
        ],
      },
      spacing: {
        units: ["rem", "px", "%"],
        spacingScale: { steps: 0 },
        spacingSizes: [
          { slug: "10", name: "Step 1", size: s["1"] },
          { slug: "20", name: "Step 2", size: s["2"] },
          { slug: "30", name: "Step 3", size: s["3"] },
          { slug: "40", name: "Step 4", size: s["4"] },
          { slug: "50", name: "Step 5", size: s["5"] },
          { slug: "60", name: "Step 6", size: s["6"] },
        ],
      },
      border: {
        radius: true,
        color: true,
        style: true,
        width: true,
      },
    },
    styles: {
      color: {
        background: p.background,
        text: p.ink,
      },
      typography: {
        fontFamily: "var(--wp--preset--font-family--body)",
        fontSize: "var(--wp--preset--font-size--medium)",
        lineHeight: "1.65",
      },
      spacing: {
        blockGap: "var(--wp--preset--spacing--30)",
        padding: {
          top: "var(--wp--preset--spacing--40)",
          right: "var(--wp--preset--spacing--30)",
          bottom: "var(--wp--preset--spacing--40)",
          left: "var(--wp--preset--spacing--30)",
        },
      },
      elements: {
        heading: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontWeight: "600",
            lineHeight: "1.2",
            letterSpacing: "-0.005em",
          },
          color: { text: p.ink },
        },
        h1: { typography: { fontSize: "var(--wp--preset--font-size--hero)" } },
        h2: { typography: { fontSize: "var(--wp--preset--font-size--xx-large)" } },
        h3: { typography: { fontSize: "var(--wp--preset--font-size--x-large)" } },
        link: {
          color: { text: p.primary },
          ":hover": { color: { text: p.accent } },
        },
        button: {
          color: { text: p.primaryContrast, background: p.primary },
          border: { radius: `${design.radius}px` },
          spacing: {
            padding: {
              top: "var(--wp--preset--spacing--20)",
              right: "var(--wp--preset--spacing--30)",
              bottom: "var(--wp--preset--spacing--20)",
              left: "var(--wp--preset--spacing--30)",
            },
          },
          typography: { fontWeight: "600" },
        },
      },
      blocks: {
        "core/quote": {
          color: { text: p.muted },
          border: { left: { color: p.border, width: "3px", style: "solid" } },
          spacing: { padding: { left: "var(--wp--preset--spacing--30)" } },
          typography: { fontStyle: "italic" },
        },
        "core/group": { border: { radius: `${design.radius}px` } },
        "core/separator": { color: { text: p.border } },
      },
    },
    customTemplates: [
      { name: "page-wide", title: "Wide page", postTypes: ["page"] },
      { name: "page-blank", title: "Blank canvas", postTypes: ["page"] },
    ],
    templateParts: [
      { area: "header", name: "header", title: "Header" },
      { area: "footer", name: "footer", title: "Footer" },
    ],
    _meta: {
      generator: "cozy-studio-wp",
      brief: {
        name: brief.name,
        kind: brief.kind,
        locale: brief.locale,
      },
    },
  };
}
