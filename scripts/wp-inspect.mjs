import { generateWpTheme } from "../src/lib/wp/index.ts";
const t = generateWpTheme("Kaviareň Zrno na Michalskej v Bratislave. Poctivá espresso káva. hello@zrno.sk", { designPresetId: "warm-paper" });
console.log(JSON.stringify(t.a11y, null, 2));
console.log("---seo checks---");
for (const c of t.seo.checks) console.log(c.ok ? "OK  " : "FAIL", c.label, c.hint ? `→ ${c.hint}` : "");
