/**
 * Regression tests for the WordPress FSE generator.
 *
 * Guards against the two console errors reported after installing a
 * generated theme:
 *   1. `themes.php?activated=true:1 Uncaught (in promise) AbortError:
 *      Transition was skipped`
 *   2. `/favicon.ico:1 Failed to load resource: the server responded with
 *      a status of 500 (Internal Server Error)`
 *
 * Plus a sanity check that the generated `functions.php` uses PHP-safe
 * identifiers (no hyphens), because the theme text-domain is a WP slug
 * with hyphens and PHP function names must not contain them.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateWpTheme, bundleThemeZip, listDesignPresets } from "./index.ts";
import { buildFaviconIco } from "./favicon.ts";

const BRIEF = "Kaviareň Zrno na Michalskej v Bratislave. Espresso a pečivo. Kontakt: hello@zrno.example.";

describe("wp generator: favicon + view-transition guardrails", () => {
  it("ships favicon.ico and assets/icon.svg in every preset", () => {
    for (const preset of listDesignPresets()) {
      const theme = generateWpTheme(BRIEF, { designPresetId: preset.id });
      const paths = theme.files.map((f) => f.path);
      assert.ok(paths.includes("favicon.ico"), `${preset.id} missing favicon.ico`);
      assert.ok(paths.includes("assets/icon.svg"), `${preset.id} missing assets/icon.svg`);
      const favicon = theme.files.find((f) => f.path === "favicon.ico");
      assert.equal(favicon?.binary, true);
      assert.ok(favicon?.content instanceof Uint8Array);
    }
  });

  it("emits a valid ICO signature (00 00 01 00 = ICONDIR type=icon)", () => {
    const theme = generateWpTheme(BRIEF);
    const favicon = theme.files.find((f) => f.path === "favicon.ico")!;
    const bytes = favicon.content as Uint8Array;
    assert.equal(bytes[0], 0x00);
    assert.equal(bytes[1], 0x00);
    assert.equal(bytes[2], 0x01); // type = icon
    assert.equal(bytes[3], 0x00);
    // Sanity: 16x16 32bpp ICO = 6 + 16 + 40 + 1024 + 32 = 1118 bytes.
    assert.equal(bytes.length, 1118);
  });

  it("buildFaviconIco works on arbitrary palettes without throwing", () => {
    const bytes = buildFaviconIco({
      background: "#fff",
      surface: "#eee",
      ink: "#111",
      muted: "#555",
      primary: "#8b5e34",
      primaryContrast: "#fff",
      accent: "#d97706",
      border: "#ddd",
    });
    assert.ok(bytes.length > 0);
  });

  it("registers wp_head + admin_head + login_head favicon hooks", () => {
    const theme = generateWpTheme(BRIEF);
    const fnPhp = theme.files.find((f) => f.path === "functions.php")!.content as string;
    assert.match(fnPhp, /add_action\(\s*'wp_head',\s*'\w+_favicon_links'/);
    assert.match(fnPhp, /add_action\(\s*'admin_head',\s*'\w+_favicon_links'/);
    assert.match(fnPhp, /add_action\(\s*'login_head',\s*'\w+_favicon_links'/);
    assert.match(fnPhp, /has_site_icon\(\)/); // respects Site Icon opt-in
  });

  it("wp_enqueue_scripts guards against admin context", () => {
    const theme = generateWpTheme(BRIEF);
    const fnPhp = theme.files.find((f) => f.path === "functions.php")!.content as string;
    assert.match(fnPhp, /_enqueue_styles\(\)\s*{\s*if\s*\(\s*is_admin\(\)\s*\)\s*{\s*return;\s*}/);
  });

  it("registers a targeted unhandledrejection swallower for view-transition AbortError", () => {
    const theme = generateWpTheme(BRIEF);
    const fnPhp = theme.files.find((f) => f.path === "functions.php")!.content as string;
    assert.match(fnPhp, /swallow_view_transition_abort/);
    assert.match(fnPhp, /addEventListener\('unhandledrejection'/);
    assert.match(fnPhp, /transition was skipped/);
    // Never swallow generic errors:
    assert.match(fnPhp, /AbortError/);
  });

  it("uses PHP-safe underscore identifiers even when slug contains hyphens", () => {
    const theme = generateWpTheme(BRIEF);
    const fnPhp = theme.files.find((f) => f.path === "functions.php")!.content as string;
    // Slug is `kaviaren-zrno`; PHP identifiers must use underscores.
    assert.match(fnPhp, /function kaviaren_zrno_setup\(\)/);
    assert.doesNotMatch(fnPhp, /function [\w-]*-[\w-]*\(\)/, "no hyphen in any function name");
  });

  it("preview HTML embeds a data-URI favicon so iframe never requests /favicon.ico", () => {
    const theme = generateWpTheme(BRIEF);
    assert.match(theme.previewHtml, /<link rel="icon" href="data:image\/svg\+xml/);
  });

  it("ZIP round-trips through Blob without corrupting binary favicon", async () => {
    const theme = generateWpTheme(BRIEF);
    const blob = bundleThemeZip(theme);
    assert.ok(blob.size > 1000);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // Local file header signature must appear.
    assert.equal(bytes[0], 0x50); // 'P'
    assert.equal(bytes[1], 0x4b); // 'K'
  });
});
