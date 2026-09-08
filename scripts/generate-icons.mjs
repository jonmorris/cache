/**
 * Generates the PWA icon set from scratch — a hand-rolled PNG encoder over
 * node:zlib, no image library. The mark is a single blocky "C" knocked out of
 * a solid green field, centred, and nothing else: at 60px on a home screen —
 * let alone 16px in a tab — anything finer than one thick stroke turns to mush.
 *
 * Running the green to the edge rather than the ink is what a home screen
 * wants: a dark-on-dark icon disappears into a dark wallpaper, and a field
 * that bleeds is exactly what a maskable icon is for.
 *
 * Run: npm run icons  (wired to predev/prebuild)
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

/* ---------- minimal PNG encoder (RGBA8, filter 0) ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const encodePng = (size, rgba) => {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    const o = y * (stride + 1);
    raw[o] = 0; // filter: none
    rgba.copy(raw, o + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

/* ---------- drawing ---------- */

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/** The field runs to the edge; the C is knocked out of it. */
const FIELD = hex('#3dd68c');
const MARK = hex('#0b0b0c');

const rect = (buf, size, x0, y0, x1, y1, [r, g, b]) => {
  const l = Math.max(0, Math.round(x0));
  const t = Math.max(0, Math.round(y0));
  const rr = Math.min(size, Math.round(x1));
  const bb = Math.min(size, Math.round(y1));
  for (let y = t; y < bb; y++) {
    let o = (y * size + l) * 4;
    for (let x = l; x < rr; x++) {
      buf[o++] = r;
      buf[o++] = g;
      buf[o++] = b;
      buf[o++] = 255;
    }
  }
};

/**
 * The mark on a 100x100 field, so it scales to any icon size: a square C
 * occupying the middle 60%, which leaves its own margin on every edge.
 *
 * `inset` shrinks the C toward the centre for maskable icons. The field is
 * never inset — bleeding to the edge is the whole point, since the launcher
 * crops to a shape of its choosing. Android guarantees only a centred circle
 * of 80% diameter, so the C's corners must sit within radius 40 of the centre
 * — a 60-unit square reaches 42.4, hence the trim. Apple masks to a squircle,
 * which clips far less, so the touch icon keeps the C at full size.
 */
const draw = (size, { inset = 1 } = {}) => {
  const buf = Buffer.alloc(size * size * 4);
  rect(buf, size, 0, 0, size, size, FIELD);

  // 100-unit field -> pixels, scaled about the centre
  const u = (v) => (50 + (v - 50) * inset) * (size / 100);

  const [x0, x1, y0, y1, s] = [20, 80, 20, 80, 15];
  rect(buf, size, u(x0), u(y0), u(x0 + s), u(y1), MARK); // spine
  rect(buf, size, u(x0), u(y0), u(x1), u(y0 + s), MARK); // top arm
  rect(buf, size, u(x0), u(y1 - s), u(x1), u(y1), MARK); // bottom arm

  return encodePng(size, buf);
};

mkdirSync(OUT, { recursive: true });

const files = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-192-maskable.png', 192, { inset: 0.88 }],
  ['icon-512-maskable.png', 512, { inset: 0.88 }],
  ['apple-touch-icon.png', 180, {}],
  ['favicon-32.png', 32, {}],
  ['favicon-16.png', 16, {}],
];

for (const [name, size, opts] of files) {
  writeFileSync(join(OUT, name), draw(size, opts));
}

console.log(`generated ${files.length} icons -> public/icons`);
