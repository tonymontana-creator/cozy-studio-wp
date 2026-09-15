/**
 * Multi-page site plan.
 *
 * Given a parsed brief, `planPages` produces the deterministic list of
 * pages (Home, About, Services/Menu/Portfolio, Blog, Contact) that a WP
 * FSE theme needs, with SK/EN copy tailored to the site kind. Sections
 * are structured data — the template renderer walks them without ever
 * calling an LLM, so offline generation always works.
 */

import type { Locale, PageDef, PageSection, SiteBrief, SiteKind } from "./types";
import { slug } from "./brief";

type L = Record<Locale, string>;

const COPY = {
  home: { sk: "Domov", en: "Home" } as L,
  about: { sk: "O nás", en: "About" } as L,
  aboutMe: { sk: "O mne", en: "About" } as L,
  services: { sk: "Služby", en: "Services" } as L,
  menu: { sk: "Menu", en: "Menu" } as L,
  work: { sk: "Práca", en: "Work" } as L,
  blog: { sk: "Blog", en: "Blog" } as L,
  contact: { sk: "Kontakt", en: "Contact" } as L,
  hours: { sk: "Otváracie hodiny", en: "Hours" } as L,
  visit: { sk: "Zastavte sa", en: "Come visit" } as L,
  learnMore: { sk: "Zistiť viac", en: "Learn more" } as L,
  readMore: { sk: "Čítať ďalej", en: "Read more" } as L,
  writeToUs: { sk: "Napíšte nám", en: "Write to us" } as L,
  latestNotes: { sk: "Posledné poznámky", en: "Latest notes" } as L,
  ourStory: { sk: "Náš príbeh", en: "Our story" } as L,
  whatWeDo: { sk: "Čo robíme", en: "What we do" } as L,
  selectedWork: { sk: "Vybrané práce", en: "Selected work" } as L,
  kindWords: { sk: "Milé slová", en: "Kind words" } as L,
} satisfies Record<string, L>;

function t(key: keyof typeof COPY, locale: Locale): string {
  return COPY[key][locale];
}

function heroFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  const kicker = brief.kind === "cafe"
    ? (l === "sk" ? "Kaviareň" : "Café")
    : brief.kind === "restaurant"
      ? (l === "sk" ? "Reštaurácia" : "Restaurant")
      : brief.kind === "portfolio"
        ? "Portfolio"
        : brief.kind === "shop"
          ? (l === "sk" ? "Obchod" : "Shop")
          : brief.kind === "blog"
            ? "Blog"
            : brief.kind === "agency"
              ? (l === "sk" ? "Štúdio" : "Studio")
              : brief.kind === "personal"
                ? (l === "sk" ? "Osobná stránka" : "Personal")
                : "Cozy";
  return {
    type: "hero",
    kicker,
    heading: brief.name,
    lede: brief.tagline,
    cta: brief.kind === "cafe" || brief.kind === "restaurant"
      ? t("visit", l)
      : t("learnMore", l),
  };
}

function featuresFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  const packs: Record<SiteKind, { title: string; body: string }[]> = {
    cafe: [
      { title: l === "sk" ? "Poctivá káva" : "Careful coffee", body: l === "sk" ? "Špeciality praženej v malých dávkach s jasným pôvodom." : "Single-origin beans roasted in small, clean batches." },
      { title: l === "sk" ? "Denné pečivo" : "Daily bakes", body: l === "sk" ? "Chlieb a koláče vyrobené každé ráno u nás." : "Bread and pastries baked fresh every morning." },
      { title: l === "sk" ? "Tiché miesto" : "Quiet room", body: l === "sk" ? "Priestor pre prácu, čítanie alebo pomalé rozhovory." : "A calm space for work, reading, or slow talk." },
    ],
    restaurant: [
      { title: l === "sk" ? "Sezónna kuchyňa" : "Seasonal cooking", body: l === "sk" ? "Menu, ktoré sa mení podľa toho, čo je najlepšie." : "A menu that follows what is best right now." },
      { title: l === "sk" ? "Miestne suroviny" : "Local sourcing", body: l === "sk" ? "Spolupráca s farmármi a malými výrobcami." : "Working with nearby farms and small producers." },
      { title: l === "sk" ? "Pokojný večer" : "Quiet evening", body: l === "sk" ? "Tlmené svetlo, dobre navrhnutá vinná karta." : "Soft light and a carefully drafted wine list." },
    ],
    portfolio: [
      { title: l === "sk" ? "Vybrané projekty" : "Selected projects", body: l === "sk" ? "Malý set prác, ktoré najlepšie hovoria o mojej práci." : "A small set of work that speaks best for the practice." },
      { title: l === "sk" ? "Proces" : "Process", body: l === "sk" ? "Ako pracujem od prvej skice po finálne odovzdanie." : "How I move from first sketch to final delivery." },
      { title: l === "sk" ? "Spolupráca" : "Collaboration", body: l === "sk" ? "Otvorená pre malé aj strednodobé projekty." : "Open for small and mid-length engagements." },
    ],
    landing: [
      { title: l === "sk" ? "Rýchly štart" : "Quick start", body: l === "sk" ? "Nastavenie za pár minút, žiadne zbytočnosti." : "Set up in minutes, nothing extra to learn." },
      { title: l === "sk" ? "Šetrí čas" : "Saves time", body: l === "sk" ? "Automatizuje rutinu, aby ste sa mohli sústrediť." : "Automates the routine so you can focus." },
      { title: l === "sk" ? "Zdieľanie" : "Sharing", body: l === "sk" ? "Zdieľajte výsledky odkazom alebo exportom." : "Share results with a link or export." },
    ],
    blog: [
      { title: l === "sk" ? "Krátke poznámky" : "Short notes", body: l === "sk" ? "Odkazy a myšlienky, ktoré stoja za druhé prečítanie." : "Links and thoughts worth a second read." },
      { title: l === "sk" ? "Dlhšie eseje" : "Longer essays", body: l === "sk" ? "Občasné hlbšie texty o remesle a nástrojoch." : "Occasional deeper pieces on craft and tools." },
      { title: l === "sk" ? "Newsletter" : "Newsletter", body: l === "sk" ? "Súhrn každý mesiac, žiadne otravné oznamy." : "A monthly digest, never a marketing blast." },
    ],
    shop: [
      { title: l === "sk" ? "Kurátorský výber" : "Curated picks", body: l === "sk" ? "Malý katalóg vybraný podľa kvality." : "A short catalog chosen for quality." },
      { title: l === "sk" ? "Doprava" : "Shipping", body: l === "sk" ? "Šetrné balenie a rýchle odoslanie." : "Careful packing, quick dispatch." },
      { title: l === "sk" ? "Podpora" : "Support", body: l === "sk" ? "Odpovedáme do 24 hodín, väčšinou skôr." : "We reply within a day, often sooner." },
    ],
    agency: [
      { title: l === "sk" ? "Návrh" : "Design", body: l === "sk" ? "Identita, produkt a rozhrania s dôrazom na detail." : "Identity, product, and interfaces built with care." },
      { title: l === "sk" ? "Vývoj" : "Build", body: l === "sk" ? "Stabilné weby a aplikácie, ktoré vydržia." : "Sturdy sites and apps that keep working." },
      { title: l === "sk" ? "Podpora" : "Support", body: l === "sk" ? "Zostávame s klientmi aj po launchi." : "We stay with clients after launch." },
    ],
    personal: [
      { title: l === "sk" ? "Práca" : "Work", body: l === "sk" ? "Čo robím a s kým rád spolupracujem." : "What I do and who I like to work with." },
      { title: l === "sk" ? "Zápisky" : "Notes", body: l === "sk" ? "Myšlienky, ktoré si nechávam nájsť neskôr." : "Thoughts I keep so I can find them later." },
      { title: l === "sk" ? "Kontakt" : "Contact", body: l === "sk" ? "Najlepšie ma zastihnete e-mailom." : "Email is the best way to reach me." },
    ],
    generic: [
      { title: l === "sk" ? "Prehľadnosť" : "Clarity", body: l === "sk" ? "Stránka bez šumu, sústredená na obsah." : "A page without noise, focused on the content." },
      { title: l === "sk" ? "Rýchlosť" : "Speed", body: l === "sk" ? "Nič zbytočné, nič načítavané zo siete tretej strany." : "Nothing extra, nothing loaded from third parties." },
      { title: l === "sk" ? "Prístupnosť" : "Accessibility", body: l === "sk" ? "Sémantické HTML a čitateľný kontrast." : "Semantic HTML and legible contrast." },
    ],
  };
  return {
    type: "features",
    heading: t("whatWeDo", l),
    items: packs[brief.kind],
  };
}

function menuFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  const isCafe = brief.kind === "cafe";
  return {
    type: "menu",
    heading: isCafe ? (l === "sk" ? "Nápoje a raňajky" : "Coffee & breakfast") : (l === "sk" ? "Menu" : "Menu"),
    groups: isCafe
      ? [
          {
            name: l === "sk" ? "Káva" : "Coffee",
            items: [
              { name: "Espresso", price: "€2.20" },
              { name: "Cortado", price: "€2.90" },
              { name: "Flat white", price: "€3.20" },
              { name: "Filter", price: "€3.40", note: l === "sk" ? "rotujúca ponuka" : "rotating single origin" },
            ],
          },
          {
            name: l === "sk" ? "K tomu" : "With that",
            items: [
              { name: l === "sk" ? "Cinnamon roll" : "Cinnamon roll", price: "€3.50" },
              { name: l === "sk" ? "Sourdough tost" : "Sourdough toast", price: "€4.20", note: l === "sk" ? "s medom alebo maslom" : "honey or butter" },
              { name: l === "sk" ? "Sezónny koláč" : "Seasonal cake", price: "€4.60" },
            ],
          },
        ]
      : [
          {
            name: l === "sk" ? "Predjedlá" : "Starters",
            items: [
              { name: l === "sk" ? "Pečený tekvicový krém" : "Roasted squash soup", price: "€6.50" },
              { name: l === "sk" ? "Burrata so sezónnym ovocím" : "Burrata with seasonal fruit", price: "€9.80" },
            ],
          },
          {
            name: l === "sk" ? "Hlavné jedlá" : "Mains",
            items: [
              { name: l === "sk" ? "Cestoviny s hríbmi" : "Mushroom pappardelle", price: "€14.20" },
              { name: l === "sk" ? "Kačacie prsia" : "Duck breast", price: "€22.00", note: l === "sk" ? "s pečenou červenou repou" : "with roasted beets" },
              { name: l === "sk" ? "Pečená zelenina" : "Roast vegetable plate", price: "€13.50" },
            ],
          },
        ],
  };
}

function hoursFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  return {
    type: "hours",
    heading: t("hours", l),
    rows: [
      { day: l === "sk" ? "Po – Pi" : "Mon – Fri", hours: brief.kind === "cafe" ? "7:30 – 18:00" : "12:00 – 22:00" },
      { day: l === "sk" ? "So" : "Sat", hours: brief.kind === "cafe" ? "8:00 – 17:00" : "12:00 – 23:00" },
      { day: l === "sk" ? "Ne" : "Sun", hours: brief.kind === "cafe" ? "9:00 – 15:00" : (l === "sk" ? "zatvorené" : "closed") },
    ],
  };
}

function testimonialsFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  return {
    type: "testimonials",
    heading: t("kindWords", l),
    quotes: [
      { quote: l === "sk" ? "Naozaj pokojné miesto na prácu aj na kávu." : "A truly calm spot to work and to have coffee.", author: "M. Kováč" },
      { quote: l === "sk" ? "Detaily, ktoré cítite pri každej návšteve." : "Details you feel on every visit.", author: "A. Novák" },
    ],
  };
}

function contactFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  return {
    type: "contact",
    heading: t("contact", l),
    address: brief.contact.address ?? (l === "sk" ? "Adresa doplňte v editore" : "Add your address in the editor"),
    email: brief.contact.email,
    phone: brief.contact.phone ?? (l === "sk" ? "+421 000 000 000" : "+1 000 000 0000"),
  };
}

function ctaFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  return {
    type: "cta",
    heading: brief.kind === "cafe" || brief.kind === "restaurant" ? t("visit", l) : t("writeToUs", l),
    body: brief.tagline,
    label: brief.kind === "shop" ? (l === "sk" ? "Do obchodu" : "Shop now") : t("contact", l),
  };
}

function proseAbout(brief: SiteBrief): PageSection {
  const l = brief.locale;
  return {
    type: "prose",
    heading: t("ourStory", l),
    body:
      l === "sk"
        ? `${brief.name} vznikla ako miesto, kde má obsah aj priestor rovnaké slovo. Píšeme, varíme, tvoríme — a snažíme sa, aby to čo robíme, malo dlhú životnosť. Táto stránka je súčasťou toho istého sľubu: pomalá, čitateľná a bez zbytočností. ${brief.description}`
        : `${brief.name} began as a place where content and space could share equal weight. We write, cook, and make things — and we try to make them last. This site is part of the same promise: slow, legible, and without extras. ${brief.description}`,
  };
}

function servicesFor(brief: SiteBrief): PageSection {
  return {
    ...featuresFor(brief),
    heading: t("services", brief.locale),
  };
}

function portfolioFor(brief: SiteBrief): PageSection {
  const l = brief.locale;
  return {
    type: "gallery",
    heading: t("selectedWork", l),
    captions:
      l === "sk"
        ? ["Identita pre kníhkupectvo", "Web pre malé vydavateľstvo", "Balenie pre pražiareň"]
        : ["Identity for a bookshop", "Site for a small press", "Packaging for a roastery"],
  };
}

function postsFor(brief: SiteBrief): PageSection {
  return { type: "posts", heading: t("latestNotes", brief.locale), count: 6 };
}

/* ---------------- Public API ---------------- */

export function planPages(brief: SiteBrief): PageDef[] {
  const l = brief.locale;
  const homeSlug = "home";
  const home: PageDef = {
    id: "home",
    slug: homeSlug,
    title: t("home", l),
    description: brief.tagline,
    sections: [heroFor(brief), featuresFor(brief), testimonialsFor(brief), ctaFor(brief)],
  };

  const about: PageDef = {
    id: "about",
    slug: slug(t(brief.kind === "personal" ? "aboutMe" : "about", l)),
    title: t(brief.kind === "personal" ? "aboutMe" : "about", l),
    description:
      l === "sk"
        ? `O ${brief.name} — príbeh, hodnoty a spôsob práce.`
        : `About ${brief.name} — the story, values, and way of working.`,
    sections: [proseAbout(brief), testimonialsFor(brief)],
  };

  const contact: PageDef = {
    id: "contact",
    slug: slug(t("contact", l)),
    title: t("contact", l),
    description:
      l === "sk" ? `Kontakt na ${brief.name}.` : `Contact information for ${brief.name}.`,
    sections: [contactFor(brief), hoursFor(brief)],
  };

  const blog: PageDef = {
    id: "blog",
    slug: slug(t("blog", l)),
    title: t("blog", l),
    description:
      l === "sk"
        ? `Poznámky, eseje a novinky z ${brief.name}.`
        : `Notes, essays, and news from ${brief.name}.`,
    sections: [postsFor(brief)],
  };

  const middle: PageDef[] = (() => {
    switch (brief.kind) {
      case "cafe":
      case "restaurant":
        return [
          {
            id: "menu",
            slug: slug(t("menu", l)),
            title: t("menu", l),
            description:
              l === "sk" ? `Aktuálne menu a nápoje ${brief.name}.` : `The current menu and drinks at ${brief.name}.`,
            sections: [menuFor(brief), hoursFor(brief), ctaFor(brief)],
          },
        ];
      case "portfolio":
      case "agency":
        return [
          {
            id: "portfolio",
            slug: slug(t("work", l)),
            title: t("work", l),
            description:
              l === "sk" ? `Vybrané projekty ${brief.name}.` : `Selected projects from ${brief.name}.`,
            sections: [portfolioFor(brief), servicesFor(brief), ctaFor(brief)],
          },
        ];
      case "shop":
      case "landing":
      case "agency":
      case "personal":
      case "blog":
      case "generic":
      default:
        return [
          {
            id: "services",
            slug: slug(t("services", l)),
            title: t("services", l),
            description:
              l === "sk" ? `Služby ${brief.name}.` : `What ${brief.name} offers.`,
            sections: [servicesFor(brief), testimonialsFor(brief), ctaFor(brief)],
          },
        ];
    }
  })();

  return [home, about, ...middle, blog, contact];
}
