/**
 * Minimal ZIP writer (STORE method, no compression).
 *
 * We deliberately avoid pulling a full compression library into the client
 * bundle — WP themes are text-heavy but only a few kilobytes, so STORE
 * mode produces a valid, WordPress-installable archive with zero deps.
 * Uses browser `CRC32` polyfill and TextEncoder; runs anywhere React runs.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}
function u32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function dosDateTime(d = new Date()): { date: number; time: number } {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    (Math.floor(d.getSeconds() / 2) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f);
  return { date, time };
}

export type ZipEntry = { path: string; content: string | Uint8Array };

export function buildZip(entries: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  const files = entries.map((e) => {
    const bytes = typeof e.content === "string" ? enc.encode(e.content) : e.content;
    const nameBytes = enc.encode(e.path);
    return { path: e.path, bytes, nameBytes, crc: crc32(bytes) };
  });

  const dt = dosDateTime();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;
  const centralRecords: { header: Uint8Array; offset: number }[] = [];

  for (const f of files) {
    const size = f.bytes.length;
    // Local file header
    const local = new Uint8Array(30 + f.nameBytes.length + size);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50);
    u16(lv, 4, 20);
    u16(lv, 6, 0);
    u16(lv, 8, 0);
    u16(lv, 10, dt.time);
    u16(lv, 12, dt.date);
    u32(lv, 14, f.crc);
    u32(lv, 18, size);
    u32(lv, 22, size);
    u16(lv, 26, f.nameBytes.length);
    u16(lv, 28, 0);
    local.set(f.nameBytes, 30);
    local.set(f.bytes, 30 + f.nameBytes.length);
    localHeaders.push(local);

    // Central directory header
    const central = new Uint8Array(46 + f.nameBytes.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50);
    u16(cv, 4, 20);
    u16(cv, 6, 20);
    u16(cv, 8, 0);
    u16(cv, 10, 0);
    u16(cv, 12, dt.time);
    u16(cv, 14, dt.date);
    u32(cv, 16, f.crc);
    u32(cv, 20, size);
    u32(cv, 24, size);
    u16(cv, 28, f.nameBytes.length);
    u16(cv, 30, 0);
    u16(cv, 32, 0);
    u16(cv, 34, 0);
    u16(cv, 36, 0);
    u32(cv, 38, 0);
    u32(cv, 42, offset);
    central.set(f.nameBytes, 46);
    centralRecords.push({ header: central, offset });
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralSize = centralHeaders.reduce((n, c) => n + c.length, 0);
  const centralOffset = offset;

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50);
  u16(ev, 4, 0);
  u16(ev, 6, 0);
  u16(ev, 8, files.length);
  u16(ev, 10, files.length);
  u32(ev, 12, centralSize);
  u32(ev, 16, centralOffset);
  u16(ev, 20, 0);

  const parts: BlobPart[] = [...localHeaders, ...centralHeaders, end].map((u) =>
    u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer,
  );
  return new Blob(parts, { type: "application/zip" });
}

export function downloadZip(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".zip") ? filename : `${filename}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
