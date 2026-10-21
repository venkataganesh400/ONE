import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// CRC32 table for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

// Signed Distance Function helpers for smooth anti-aliased rendering in 512x512 virtual canvas
function sdRoundBox(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function sampleVirtual512(vx, vy, isMaskable) {
  const aa = 1.2;

  // 1. Outer Squircle Boundary (unless maskable full-bleed)
  let bgAlpha = 1.0;
  let borderMix = 0.0;
  if (!isMaskable) {
    const dOuter = sdRoundBox(vx - 256, vy - 256, 256, 256, 116);
    bgAlpha = clamp(0.5 - dOuter / aa, 0, 1);
    if (bgAlpha <= 0) return [0, 0, 0, 0];

    const dBorder = Math.abs(dOuter + 4) - 2.0;
    borderMix = clamp(0.5 - dBorder / aa, 0, 1);
  }

  // Background vertical gradient: #18181b (24,24,27) -> #050505 (5,5,5)
  const gy = clamp(vy / 512, 0, 1);
  let r = mix(24, 5, gy);
  let g = mix(24, 5, gy);
  let b = mix(27, 5, gy);

  // Subtle border highlight
  if (borderMix > 0) {
    const bCol = mix(63, 24, gy);
    r = mix(r, bCol, borderMix);
    g = mix(g, bCol, borderMix);
    b = mix(b, bCol + 3, borderMix);
  }

  // Transform into inner safe zone if maskable
  let ix = vx;
  let iy = vy;
  if (isMaskable) {
    ix = (vx - 256) / 0.8 + 256;
    iy = (vy - 256) / 0.8 + 256;
  }

  // 2. Architectural Ring (radius 168, strokeWidth 6)
  const dx = ix - 256;
  const dy = iy - 256;
  const distRing = Math.abs(Math.hypot(dx, dy) - 168) - 3.0;
  const ringAlpha = clamp(0.5 - distRing / aa, 0, 1);
  if (ringAlpha > 0) {
    // Check if in top-right quadrant (dx >= 0, dy <= 0) for white focus arc
    const inArc = dx >= -2 && dy <= 2;
    const targetR = inArc ? 255 : 39;
    const targetG = inArc ? 255 : 39;
    const targetB = inArc ? 255 : 42;
    r = mix(r, targetR, ringAlpha);
    g = mix(g, targetG, ringAlpha);
    b = mix(b, targetB, ringAlpha);
  }

  // 3. Subtle Silver Folded Wing: Triangle (196,204) -> (244,156) -> (244,204)
  // Inside test: x <= 244, y <= 204, and (x - 196) + (204 - y) <= 48 => y >= 156 + (244 - x)
  const dWingRight = ix - 244;
  const dWingBottom = iy - 204;
  const dWingDiag = (156 + (244 - ix) - iy) * Math.SQRT1_2;
  const dWing = Math.max(dWingRight, dWingBottom, dWingDiag);
  const wingAlpha = clamp(0.5 - dWing / aa, 0, 1);
  if (wingAlpha > 0) {
    r = mix(r, 161, wingAlpha);
    g = mix(g, 161, wingAlpha);
    b = mix(b, 170, wingAlpha);
  }

  // 4. Pure White Primary Stem: rect x=244..288 (cx=266, w=44->bx=22), y=156..356 (cy=256, h=200->by=100), rx=6
  const dStem = sdRoundBox(ix - 266, iy - 256, 22, 100, 6);
  const stemAlpha = clamp(0.5 - dStem / aa, 0, 1);
  if (stemAlpha > 0) {
    const stemT = clamp((iy - 156) / 200, 0, 1);
    const stemCol = mix(255, 232, stemT);
    r = mix(r, stemCol, stemAlpha);
    g = mix(g, stemCol, stemAlpha);
    b = mix(b, stemCol, stemAlpha);
  }

  return [Math.round(r), Math.round(g), Math.round(b), Math.round(bgAlpha * 255)];
}

function createPng(width, height, isMaskable = false) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  const scale = 512 / width;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter type 0

    for (let x = 0; x < width; x++) {
      // 2x2 supersampling for crisp downscaling at all sizes (including 32x32 favicon)
      let sr = 0, sg = 0, sb = 0, sa = 0;
      const offsets = [0.25, 0.75];
      for (const oy of offsets) {
        for (const ox of offsets) {
          const vx = (x + ox) * scale;
          const vy = (y + oy) * scale;
          const [r, g, b, a] = sampleVirtual512(vx, vy, isMaskable);
          sr += r;
          sg += g;
          sb += b;
          sa += a;
        }
      }
      scanlines[offset++] = Math.round(sr / 4);
      scanlines[offset++] = Math.round(sg / 4);
      scanlines[offset++] = Math.round(sb / 4);
      scanlines[offset++] = Math.round(sa / 4);
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdr);
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

console.log('Generating minimal monochrome PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32, false));
console.log('All monochrome PWA icons generated!');
