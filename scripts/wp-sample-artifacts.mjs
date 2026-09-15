import { generateWpTheme, bundleThemeZip } from "../src/lib/wp/index.ts";
import { writeFileSync } from "node:fs";
const brief = `Kaviareň Zrno na Michalskej v Bratislave. Poctivá espresso káva praženej v malých dávkach, denné pečivo z lokálnej pekárne a tiché miesto na prácu či pomalé rozhovory. Otvorené každý deň okrem nedele. Kontakt: hello@zrno.example, +421 900 123 456, adresa Michalská 12.`;
const theme = generateWpTheme(brief, { designPresetId: "warm-paper" });
const zip = bundleThemeZip(theme);
writeFileSync("/home/user/workspace/kaviaren-zrno-theme.zip", Buffer.from(await zip.arrayBuffer()));
writeFileSync("/home/user/workspace/kaviaren-zrno-preview.html", theme.previewHtml);
console.log("theme", theme.slug, "files", theme.files.length, "zip bytes", zip.size);
console.log("preview bytes", theme.previewHtml.length);
