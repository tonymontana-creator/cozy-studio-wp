import { generateWpTheme, listDesignPresets } from "../src/lib/wp/index.ts";
const brief = "Ateliér Slnka — dizajnové štúdio pre knihy a plagáty. hello@atelier.example";
for (const p of listDesignPresets()) {
  const t = generateWpTheme(brief, { designPresetId: p.id });
  const fails = t.a11y.contrast.filter(c => !c.ok).map(c => `${c.role}/${c.against}=${c.ratio.toFixed(2)}`);
  console.log(p.id.padEnd(12), "seo", t.seo.score, "a11y", t.a11y.score, "contrast issues:", fails.length ? fails.join(", ") : "none");
}
