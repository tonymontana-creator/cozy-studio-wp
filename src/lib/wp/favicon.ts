/**
 * Favicon generator.
 *
 * WordPress FSE themes without a Site Icon leave the browser requesting
 * `/favicon.ico` from the origin root. On many installs (nginx strict-mode,
 * hardened PHP handlers, WAF rules) that missing file surfaces as a 500 in
 * the browser dev console — even though it is a harmless static miss.
 *
 * We ship two things with every generated theme:
 *  1. `favicon.ico` in the theme root — a real 16×16 ICO with a solid
 *     square filled with the palette's primary color plus a contrasting
 *     accent dot. No external tooling required.
 *  2. `assets/icon.svg` — the SVG equivalent for modern browsers.
 *
 * `functions.php` then hooks `wp_head` to emit `<link rel="icon">` tags
 * pointing at `get_stylesheet_directory_uri()`, so the request never
 * touches the origin root and the console stays clean.
 */

import type { ColorPalette } from "./types.ts";

/** Parse `#rrggbb` (or `#rgb`) to `{r,g,b}` bytes. Falls back to neutral gray. */
function parseHex(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== "string") return { r: 128, g: 128, b: 128 };
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 128, g: 128, b: 128 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Build a 16×16 32-bit BGRA ICO file as Uint8Array.
 *
 * The ICO format is: ICONDIR (6B) + ICONDIRENTRY (16B) + BITMAPINFOHEADER (40B)
 * + pixel data (16×16×4 = 1024B) + AND mask (16×16÷8 = 32B, all zeros = fully
 * opaque). Total 1118 bytes.
 *
 * Design: primary-colored rounded square with an accent-colored dot in the
 * lower-right corner — reads as a friendly favicon at 16×16.
 */
export function buildFaviconIco(palette: ColorPalette): Uint8Array {
  const primary = parseHex(palette.primary);
  const accent = parseHex(palette.accent || palette.primary);
  const bg = parseHex(palette.background);

  const size = 16;
  const pixels = new Uint8Array(size * size * 4);

  // Rounded-square mask: skip corner pixels for a softer silhouette.
  const isCorner = (x: number, y: number): boolean => {
    // 1-pixel bevel at each corner
    return (
      (x === 0 && y === 0) ||
      (x === size - 1 && y === 0) ||
      (x === 0 && y === size - 1) ||
      (x === size - 1 && y === size - 1)
    );
  };

  // ICO stores rows bottom-up.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcY = size - 1 - y;
      const idx = (y * size + x) * 4;
      let color = primary;
      let alpha = 255;
      if (isCorner(x, srcY)) {
        color = bg;
        alpha = 0;
      } else if (srcY >= 10 && srcY <= 13 && x >= 10 && x <= 13) {
        color = accent;
      }
      // BGRA
      pixels[idx + 0] = color.b;
      pixels[idx + 1] = color.g;
      pixels[idx + 2] = color.r;
      pixels[idx + 3] = alpha;
    }
  }

  const andMask = new Uint8Array((size * size) / 8); // all zeros -> opaque

  const iconDir = new Uint8Array(6);
  const iconDirView = new DataView(iconDir.buffer);
  iconDirView.setUint16(0, 0, true); // reserved
  iconDirView.setUint16(2, 1, true); // type = icon
  iconDirView.setUint16(4, 1, true); // count = 1

  const bmpHeaderSize = 40;
  const imageSize = bmpHeaderSize + pixels.length + andMask.length;

  const dirEntry = new Uint8Array(16);
  const de = new DataView(dirEntry.buffer);
  de.setUint8(0, size); // width (0 = 256)
  de.setUint8(1, size); // height
  de.setUint8(2, 0); // no palette
  de.setUint8(3, 0); // reserved
  de.setUint16(4, 1, true); // color planes
  de.setUint16(6, 32, true); // bits per pixel
  de.setUint32(8, imageSize, true); // image size
  de.setUint32(12, 6 + 16, true); // offset to image data

  const bmp = new Uint8Array(bmpHeaderSize);
  const bv = new DataView(bmp.buffer);
  bv.setUint32(0, bmpHeaderSize, true); // header size
  bv.setInt32(4, size, true); // width
  bv.setInt32(8, size * 2, true); // height = image + mask
  bv.setUint16(12, 1, true); // planes
  bv.setUint16(14, 32, true); // bpp
  bv.setUint32(16, 0, true); // BI_RGB
  bv.setUint32(20, pixels.length + andMask.length, true); // image size
  // remaining fields (ppm, colors used) stay zero

  const out = new Uint8Array(6 + 16 + imageSize);
  out.set(iconDir, 0);
  out.set(dirEntry, 6);
  out.set(bmp, 22);
  out.set(pixels, 22 + bmpHeaderSize);
  out.set(andMask, 22 + bmpHeaderSize + pixels.length);
  return out;
}

/** SVG icon used by modern browsers via `<link rel="icon" type="image/svg+xml">`. */
export function buildIconSvg(palette: ColorPalette): string {
  const primary = palette.primary || "#333";
  const accent = palette.accent || primary;
  const bg = palette.background || "#fff";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Site icon">
  <rect width="64" height="64" rx="12" fill="${bg}"/>
  <rect x="6" y="6" width="52" height="52" rx="10" fill="${primary}"/>
  <circle cx="46" cy="46" r="7" fill="${accent}"/>
</svg>
`;
}

/**
 * Data-URI SVG favicon used inside the Studio iframe preview so the sandboxed
 * frame never requests `/favicon.ico` from its (blob:) origin and pollutes the
 * console with 404/500 network errors.
 */
export function buildFaviconDataUri(palette: ColorPalette): string {
  const svg = buildIconSvg(palette).replace(/^<\?xml[^>]*\?>\s*/, "");
  // URL-encode only what the data-URI parser strictly requires.
  const encoded = svg
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22")
    .replace(/\n/g, "");
  return `data:image/svg+xml;utf8,${encoded}`;
}
