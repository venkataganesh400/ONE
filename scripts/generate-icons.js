import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// HTML generator for rendering icons
const iconSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'), 'utf-8');
const iconMaskableSvg = fs.readFileSync(path.join(publicDir, 'icon-maskable.svg'), 'utf-8');

const htmlAny = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${iconSvg}
</body>
</html>`;

const htmlMaskable = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0f172a; display: flex; align-items: center; justify-content: center; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${iconMaskableSvg}
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, '_render_any.html'), htmlAny);
fs.writeFileSync(path.join(publicDir, '_render_maskable.html'), htmlMaskable);

console.log('Rendering icon PNGs via playwright-cli...');
