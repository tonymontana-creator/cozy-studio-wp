/**
 * Design system presets and utilities.
 *
 * Exposes named palettes (warm paper, coastal, forest, midnight, sunset),
 * typography stacks, spacing scales, and WCAG-aware contrast helpers so the
 * generator can validate any custom palette against a11y requirements before
 * baking it into `theme.json`.
 */

import type { ColorPalette, DesignSystem, Spacing, Typography } from "./types";

/* ---------------- Color / WCAG helpers ---------------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 0xff, g: (int >> 8) & 0xff, b: int & 0xff };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lo, hi] = la < lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function meetsAA(fg: string, bg: string, large = false): boolean {
  const r = contrastRatio(fg, bg);
  return large ? r >= 3 : r >= 4.5;
}

/* ---------------- Palette presets ---------------- */

export const PALETTES: Record<string, ColorPalette> = {
  "warm-paper": {
    background: "#f4efe6",
    surface: "#faf6ee",
    ink: "#1c1915",
    muted: "#5b5147",
    primary: "#a94628",
    primaryContrast: "#fdf9f1",
    accent: "#2f5d50",
    border: "#e2d8c7",
  },
  coastal: {
    background: "#eef4f6",
    surface: "#ffffff",
    ink: "#0f2933",
    muted: "#4b6773",
    primary: "#0e7c86",
    primaryContrast: "#ffffff",
    accent: "#a15d0a",
    border: "#d3e0e5",
  },
  forest: {
    background: "#eef2ea",
    surface: "#ffffff",
    ink: "#1c2a1b",
    muted: "#4d5e46",
    primary: "#2f6b3a",
    primaryContrast: "#ffffff",
    accent: "#8a6a10",
    border: "#d4dcc9",
  },
  midnight: {
    background: "#101318",
    surface: "#181c24",
    ink: "#f2eee5",
    muted: "#a8a196",
    primary: "#f4a261",
    primaryContrast: "#101318",
    accent: "#8ecae6",
    border: "#242a34",
  },
  sunset: {
    background: "#fdf3ec",
    surface: "#ffffff",
    ink: "#2b1b16",
    muted: "#6b4a3b",
    primary: "#b0361a",
    primaryContrast: "#ffffff",
    accent: "#7a2652",
    border: "#f0dccb",
  },
};

/* ---------------- Typography presets ---------------- */

const STACK_SYSTEM =
  "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
const STACK_SERIF =
  '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif';
const STACK_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const TYPOGRAPHY: Record<string, Typography> = {
  ink: {
    headingFamily: "Ink Display",
    headingStack: STACK_SERIF,
    bodyFamily: "Ink Body",
    bodyStack: STACK_SERIF,
    baseSize: 17,
    scale: 1.25,
  },
  modern: {
    headingFamily: "Grotesk",
    headingStack: STACK_SYSTEM,
    bodyFamily: "Grotesk",
    bodyStack: STACK_SYSTEM,
    baseSize: 16,
    scale: 1.2,
  },
  editorial: {
    headingFamily: "Editorial",
    headingStack: STACK_SERIF,
    bodyFamily: "Editorial Sans",
    bodyStack: STACK_SYSTEM,
    baseSize: 18,
    scale: 1.333,
  },
  mono: {
    headingFamily: "Monolab",
    headingStack: STACK_MONO,
    bodyFamily: "Monolab Sans",
    bodyStack: STACK_SYSTEM,
    baseSize: 15,
    scale: 1.2,
  },
};

/* ---------------- Spacing presets ---------------- */

export const SPACING: Record<string, Spacing> = {
  cozy: { unit: 8, scale: 1.5, containerMaxWidth: 1120 },
  compact: { unit: 6, scale: 1.4, containerMaxWidth: 1040 },
  airy: { unit: 10, scale: 1.6, containerMaxWidth: 1200 },
};

/* ---------------- Preset combinations ---------------- */

export const DESIGN_PRESETS: Record<string, DesignSystem> = {
  "warm-paper": {
    name: "Warm Paper",
    palette: PALETTES["warm-paper"]!,
    typography: TYPOGRAPHY.ink!,
    spacing: SPACING.cozy!,
    radius: 6,
  },
  coastal: {
    name: "Coastal Ink",
    palette: PALETTES.coastal!,
    typography: TYPOGRAPHY.modern!,
    spacing: SPACING.airy!,
    radius: 10,
  },
  forest: {
    name: "Forest Field",
    palette: PALETTES.forest!,
    typography: TYPOGRAPHY.editorial!,
    spacing: SPACING.cozy!,
    radius: 8,
  },
  midnight: {
    name: "Midnight Studio",
    palette: PALETTES.midnight!,
    typography: TYPOGRAPHY.mono!,
    spacing: SPACING.compact!,
    radius: 4,
  },
  sunset: {
    name: "Sunset Bistro",
    palette: PALETTES.sunset!,
    typography: TYPOGRAPHY.editorial!,
    spacing: SPACING.cozy!,
    radius: 12,
  },
};

export function designPresetIds(): string[] {
  return Object.keys(DESIGN_PRESETS);
}

export function getDesignPreset(id: string): DesignSystem {
  return DESIGN_PRESETS[id] ?? DESIGN_PRESETS["warm-paper"]!;
}

/**
 * Compute the modular type scale for a given base + ratio.
 * Returns { xs, sm, base, lg, xl, xxl, hero } in rem.
 */
export function typeScaleRem(t: Typography): Record<string, string> {
  const base = t.baseSize / 16;
  const r = t.scale;
  return {
    xs: `${(base / r).toFixed(3)}rem`,
    sm: `${(base / Math.sqrt(r)).toFixed(3)}rem`,
    base: `${base.toFixed(3)}rem`,
    lg: `${(base * r).toFixed(3)}rem`,
    xl: `${(base * r * r).toFixed(3)}rem`,
    xxl: `${(base * r * r * r).toFixed(3)}rem`,
    hero: `${(base * r * r * r * r).toFixed(3)}rem`,
  };
}

/** Space steps in rem for consistent spacing scale in CSS / theme.json */
export function spaceScaleRem(s: Spacing): Record<string, string> {
  const base = s.unit / 16;
  const r = s.scale;
  return {
    "1": `${base.toFixed(3)}rem`,
    "2": `${(base * r).toFixed(3)}rem`,
    "3": `${(base * r * r).toFixed(3)}rem`,
    "4": `${(base * r * r * r).toFixed(3)}rem`,
    "5": `${(base * r * r * r * r).toFixed(3)}rem`,
    "6": `${(base * r * r * r * r * r).toFixed(3)}rem`,
  };
}
