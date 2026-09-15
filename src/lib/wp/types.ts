/**
 * Core types for the WordPress FSE (Full Site Editing) theme generator.
 *
 * Everything the studio needs to describe a site — brief, design system,
 * pages, and the resulting theme bundle — lives here as a single source
 * of truth. All modules under `src/lib/wp/` consume these shapes.
 */

export type SiteKind =
  | "cafe"
  | "restaurant"
  | "portfolio"
  | "landing"
  | "blog"
  | "shop"
  | "agency"
  | "personal"
  | "generic";

export type Locale = "sk" | "en";

export type ColorRole =
  | "background"
  | "surface"
  | "ink"
  | "muted"
  | "primary"
  | "primaryContrast"
  | "accent"
  | "border";

export type ColorPalette = Record<ColorRole, string>;

export type Typography = {
  headingFamily: string;
  headingStack: string;
  bodyFamily: string;
  bodyStack: string;
  baseSize: number; // px
  scale: number; // modular scale ratio
};

export type Spacing = {
  unit: number; // px base
  scale: number; // ratio for spacing steps
  containerMaxWidth: number; // px
};

export type DesignSystem = {
  name: string; // e.g. "Warm Paper", "Coastal Ink"
  palette: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  radius: number; // px
};

export type PageId =
  | "home"
  | "about"
  | "services"
  | "menu"
  | "portfolio"
  | "blog"
  | "contact";

export type PageSection =
  | { type: "hero"; kicker: string; heading: string; lede: string; cta?: string }
  | { type: "features"; heading: string; items: { title: string; body: string }[] }
  | { type: "menu"; heading: string; groups: { name: string; items: { name: string; price: string; note?: string }[] }[] }
  | { type: "hours"; heading: string; rows: { day: string; hours: string }[] }
  | { type: "gallery"; heading: string; captions: string[] }
  | { type: "testimonials"; heading: string; quotes: { quote: string; author: string }[] }
  | { type: "cta"; heading: string; body: string; label: string }
  | { type: "contact"; heading: string; address: string; email: string; phone: string }
  | { type: "prose"; heading: string; body: string }
  | { type: "posts"; heading: string; count: number };

export type PageDef = {
  id: PageId;
  slug: string;
  title: string;
  description: string; // used for meta description
  sections: PageSection[];
};

export type SiteBrief = {
  name: string; // brand / site name
  tagline: string;
  description: string; // longer paragraph, used for SEO + hero lede
  kind: SiteKind;
  locale: Locale;
  contact: {
    email: string;
    phone?: string;
    address?: string;
  };
  raw: string; // the original user brief text
};

export type SeoReport = {
  score: number; // 0-100
  checks: { id: string; label: string; ok: boolean; hint?: string }[];
};

export type A11yReport = {
  score: number;
  checks: { id: string; label: string; ok: boolean; hint?: string }[];
  contrast: { role: string; against: string; ratio: number; ok: boolean }[];
};

export type WpFile = {
  path: string; // relative to theme root, e.g. "theme.json"
  content: string | Uint8Array;
  binary?: boolean; // true for binary payloads (e.g. favicon.ico)
};

export type WpTheme = {
  slug: string; // theme folder slug
  name: string;
  version: string;
  brief: SiteBrief;
  design: DesignSystem;
  pages: PageDef[];
  files: WpFile[];
  previewHtml: string; // rendered static preview of the home page for the iframe
  seo: SeoReport;
  a11y: A11yReport;
};
