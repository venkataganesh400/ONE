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

function createPng(width, height, isMaskable = false) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      // Check rounded corner boundary if not maskable
      let inBox = true;
      if (!isMaskable) {
        const dx = Math.abs(x - cx) - (cx - cornerRadius);
        const dy = Math.abs(y - cy) - (cy - cornerRadius);
        if (dx > 0 && dy > 0) {
          inBox = (dx * dx + dy * dy) <= (cornerRadius * cornerRadius);
        }
      }

      if (!inBox) {
        // Transparent outside rounded corner
        scanlines[offset++] = 0;
        scanlines[offset++] = 0;
        scanlines[offset++] = 0;
        scanlines[offset++] = 0;
        continue;
      }

      // Background gradient: slate-900 (#0f172a) to deep indigo (#1e1b4b) to black (#020617)
      const gradT = (x + y) / (width + height);
      let r = Math.round(15 * (1 - gradT) + 30 * gradT * 0.5 + 2 * gradT);
      let g = Math.round(23 * (1 - gradT) + 27 * gradT * 0.5 + 6 * gradT);
      let b = Math.round(42 * (1 - gradT) + 75 * gradT * 0.5 + 23 * gradT);
      let a = 255;

      // Distance from center
      const distFromCenter = Math.hypot(x - cx, y - cy);

      // Ring Orbit (indigo/cyan accent)
      const ringRadius = width * (isMaskable ? 0.32 : 0.38);
      const ringDist = Math.abs(distFromCenter - ringRadius);
      if (ringDist < width * 0.02) {
        const ringAlpha = Math.max(0, 1 - ringDist / (width * 0.02));
        r = Math.round(r * (1 - ringAlpha) + 56 * ringAlpha);
        g = Math.round(g * (1 - ringAlpha) + 189 * ringAlpha);
        b = Math.round(b * (1 - ringAlpha) + 248 * ringAlpha);
      }

      // Center Monogram "1"
      // Scale coordinates to normalized box [-1, 1]
      const scale = isMaskable ? 0.7 : 0.85;
      const nx = (x - cx) / (cx * scale);
      const ny = (y - cy) / (cy * scale);

      // Vertical stem of "1": nx between -0.05 and 0.12, ny between -0.45 and 0.45
      const inStem = nx >= -0.05 && nx <= 0.12 && ny >= -0.42 && ny <= 0.42;
      // Top slant of "1": triangular seraph from (-0.28, -0.22) to (0.05, -0.42)
      const inSeraph = nx >= -0.26 && nx <= 0.05 && ny >= -0.45 && ny <= (-0.22 + (nx + 0.26) * (-0.23 / 0.31) + 0.12);
      // Bottom pedestal of "1": nx between -0.32 and 0.32, ny between 0.35 and 0.45
      const inPedestal = nx >= -0.32 && nx <= 0.32 && ny >= 0.35 && ny <= 0.45;
      // Accent orb dot: around (0.32, -0.32)
      const inDot = Math.hypot(nx - 0.32, ny - (-0.32)) <= 0.09;

      if (inStem || inSeraph || inPedestal || inDot) {
        // Glowing gradient: cyan (#38bdf8) to indigo (#6366f1) to purple (#a855f7)
        const markT = (ny + 0.45) / 0.9;
        r = Math.round(56 * (1 - markT) + 99 * 0.4 + 168 * markT);
        g = Math.round(189 * (1 - markT) + 102 * 0.4 + 85 * markT);
        b = Math.round(248 * (1 - markT) + 241 * 0.4 + 247 * markT);
      }

      scanlines[offset++] = Math.min(255, Math.max(0, r));
      scanlines[offset++] = Math.min(255, Math.max(0, g));
      scanlines[offset++] = Math.min(255, Math.max(0, b));
      scanlines[offset++] = a;
    }
  }

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate all required PWA icons
console.log('Generating PWA icons...');
const icon192 = createPng(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = createPng(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable512 = createPng(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable512);

const appleTouchIcon = createPng(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// Favicon 32x32 ICO compatible
const faviconPng = createPng(32, 32, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconPng);

// Clean up temporary render HTML
try {
  fs.unlinkSync(path.join(publicDir, '_render_any.html'));
  fs.unlinkSync(path.join(publicDir, '_render_maskable.html'));
} catch (e) {}

console.log('All PWA icons successfully generated!');
