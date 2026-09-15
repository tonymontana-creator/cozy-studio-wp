// Smoke test for the WP generator. Runs via tsx-free ESM by using the raw source
// through esbuild's built-in transformer indirectly — but to avoid extra deps we
// instead lightly typecheck by loading the compiled JS if present. For the initial
// smoke, we rely on `tsc --noEmit` (npm run typecheck) plus a runtime check that
// mirrors the client call surface using dynamic import via `--experimental-strip-types`.
//
// Usage: node --experimental-strip-types scripts/wp-smoke.mjs
//
// This is a diagnostic aid — the primary correctness gate is `npm run typecheck`.

import { generateWpTheme, bundleThemeZip, listDesignPresets } from "../src/lib/wp/index.ts";

const brief = `Kaviareň Zrno na Michalskej v Bratislave. Poctivá espresso káva, denné pečivo, tiché miesto na prácu. Otvorené každý deň okrem nedele. Kontakt: hello@zrno.sk, +421 900 123 456.`;

const theme = generateWpTheme(brief, { designPresetId: "warm-paper" });
console.log("theme.slug", theme.slug);
console.log("theme.name", theme.name);
console.log("pages", theme.pages.map((p) => `${p.title} (/${p.slug})`));
console.log("files", theme.files.length, "presets", listDesignPresets().length);
console.log("seo score", theme.seo.score);
console.log("a11y score", theme.a11y.score);
console.log("preview html length", theme.previewHtml.length);
const zip = bundleThemeZip(theme);
console.log("zip size", zip.size, "bytes");
