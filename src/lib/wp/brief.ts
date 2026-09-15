/**
 * Deterministic brief parser.
 *
 * Turns a free-form user prompt (SK or EN) into a structured `SiteBrief`
 * without needing an LLM. Keyword heuristics classify the site kind and
 * extract a plausible name, tagline, contact info, and locale. When the
 * caller adds richer content via an AI model, this parser still supplies
 * defaults so the generator never blocks on missing fields.
 */

import type { Locale, SiteBrief, SiteKind } from "./types";

const KIND_RULES: { kind: SiteKind; patterns: RegExp[] }[] = [
  {
    kind: "cafe",
    patterns: [/\bcaf[eé]\b/i, /kavia/i, /coffee/i, /espresso/i, /roast/i],
  },
  {
    kind: "restaurant",
    patterns: [
      /reštau/i, /restau/i, /bistro/i, /jed[aá]l/i, /pizzeria/i, /pizzer/i,
      /taverna/i, /grill/i, /menu\b/i, /kuchyňa/i,
    ],
  },
  {
    kind: "portfolio",
    patterns: [/portfoli/i, /portfólio/i, /designer/i, /photograph/i, /fotograf/i, /umelec/i],
  },
  {
    kind: "shop",
    patterns: [/shop\b/i, /e-?shop/i, /obchod/i, /store\b/i, /predaj/i, /woocommerce/i],
  },
  {
    kind: "agency",
    patterns: [/agency/i, /agent[uú]ra/i, /studio\b/i, /štúdio/i, /consult/i, /konzult/i],
  },
  {
    kind: "blog",
    patterns: [/\bblog\b/i, /magaz[ií]n/i, /magazine/i, /journal/i, /denník/i],
  },
  {
    kind: "personal",
    patterns: [/osobn[aáyý]/i, /o mne/i, /about me/i, /životopis/i, /resume\b/i, /cv\b/i],
  },
  {
    kind: "landing",
    patterns: [/landing/i, /pristáv/i, /produkt/i, /startup/i, /saas/i, /app\b/i],
  },
];

function detectKind(raw: string): SiteKind {
  for (const rule of KIND_RULES) {
    if (rule.patterns.some((p) => p.test(raw))) return rule.kind;
  }
  return "generic";
}

const SK_MARKERS =
  /(č|š|ť|ž|ý|á|é|í|ó|ú|ľ|ĺ|ň|ď)|\b(pre|náš|naša|s\ ohľadom|kaviarn|jedálne|obchod|reštaurác|kontakt)\b/i;

function detectLocale(raw: string): Locale {
  return SK_MARKERS.test(raw) ? "sk" : "en";
}

function firstEmail(raw: string): string {
  return raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
}

function firstPhone(raw: string): string | undefined {
  const m = raw.match(/(\+?\d[\d\s().-]{7,}\d)/);
  return m?.[1]?.trim();
}

function firstAddress(raw: string): string | undefined {
  const m = raw.match(/(?:na|at|address:?)\s+([A-ZÁČĎÉÍĽŇÓŠŤÚÝŽ][^,.\n]{4,60}(?:,\s*[^,.\n]{2,40})?)/i);
  return m?.[1]?.trim();
}

/**
 * Extract a brand name candidate.
 * Priority: quoted name → capitalized 1-3 word noun phrase before a comma / verb → first line.
 */
function detectName(raw: string, fallback: string): string {
  const quoted = raw.match(/["„»]([^"”«]{2,40})["”«]/);
  if (quoted?.[1]) return quoted[1].trim();
  const nameLine = raw.match(/^(?:site name|name|názov|volá sa|for)\s*[:\-–]\s*([^\n.,;]{2,60})/im);
  if (nameLine?.[1]) return nameLine[1].trim();
  const cap = raw.match(/\b([A-ZÁČĎÉÍĽŇÓŠŤÚÝŽ][\wÀ-ž]{2,}(?:\s+[A-ZÁČĎÉÍĽŇÓŠŤÚÝŽ][\wÀ-ž]{2,}){0,2})\b/);
  if (cap?.[1]) return cap[1];
  const firstLine = raw.split(/\n/)[0]?.trim();
  if (firstLine && firstLine.length < 60) return firstLine;
  return fallback;
}

function detectTagline(raw: string, kind: SiteKind, locale: Locale): string {
  const first = raw.split(/[.\n]/)[0]?.trim() ?? "";
  if (first.length > 12 && first.length < 90) return first;
  return DEFAULT_TAGLINE[locale][kind];
}

const DEFAULT_TAGLINE: Record<Locale, Record<SiteKind, string>> = {
  sk: {
    cafe: "Kaviareň s teplým denným svetlom a poctivou kávou.",
    restaurant: "Reštaurácia so sezónnou kuchyňou pre pokojné večery.",
    portfolio: "Portfólio, ktoré nechá práci hovoriť samú.",
    landing: "Jednoduchá stránka pre jasný produktový sľub.",
    blog: "Zápisky a poznámky z každodennej práce.",
    shop: "Obchod so starostlivo vybranými produktmi.",
    agency: "Malé štúdio so zameraním na remeslo a detail.",
    personal: "Osobná stránka pre prácu, zápisky a kontakt.",
    generic: "Tichá stránka, ktorá vydrží dlhé roky.",
  },
  en: {
    cafe: "A neighborhood café built around slow mornings.",
    restaurant: "Seasonal cooking in a quiet dining room.",
    portfolio: "A calm portfolio that lets the work speak.",
    landing: "A one-page site with a clear product promise.",
    blog: "Notes and small essays from daily practice.",
    shop: "A carefully curated online store.",
    agency: "A small studio focused on craft and detail.",
    personal: "A personal site for work, notes, and contact.",
    generic: "A quiet site built to last.",
  },
};

export function parseBrief(raw: string): SiteBrief {
  const kind = detectKind(raw);
  const locale = detectLocale(raw);
  const name = detectName(raw, "New Studio");
  const tagline = detectTagline(raw, kind, locale);
  const description =
    raw.trim().length > 60
      ? raw.trim().replace(/\s+/g, " ").slice(0, 320)
      : `${tagline} ${DEFAULT_TAGLINE[locale][kind]}`;
  return {
    name,
    tagline,
    description,
    kind,
    locale,
    contact: {
      email: firstEmail(raw) || `hello@${slug(name)}.example`,
      phone: firstPhone(raw),
      address: firstAddress(raw),
    },
    raw,
  };
}

export function slug(input: string): string {
  return (
    input
      .toString()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "cozy-site"
  );
}
