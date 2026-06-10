#!/usr/bin/env node
// Procedurally draws one transparent PNG per part_code in the Part Master
// and writes them to public/assets/parts/<part_code>.png.
//
// Each PNG is a small stylized icon (~120px wide, transparent background)
// that represents the part. The actual rendered size in the bracelet
// preview is independent of the PNG pixel width — the frontend positions
// each part by assembly_pitch_mm, not by image width.

import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'assets', 'parts');
mkdirSync(outDir, { recursive: true });

// Brand palette — used for the icon strokes. The live UI uses Tailwind
// colors directly; the assets themselves are gold/black so they read as
// "real" jewelry parts on the white background.
const GOLD = [196, 156, 76, 255];      // warm gold
const GOLD_DARK = [148, 108, 36, 255]; // deeper gold
const ROSE = [200, 130, 110, 255];     // rose gold (charms)
const INK = [26, 26, 28, 255];         // near-black accent (end caps)
const TRANSPARENT = [0, 0, 0, 0];

/** Fill a rectangle region. */
function fillRect(png, x, y, w, h, color) {
  const W = png.width, H = png.height;
  for (let j = 0; j < h; j++) {
    const py = y + j;
    if (py < 0 || py >= H) continue;
    for (let i = 0; i < w; i++) {
      const px = x + i;
      if (px < 0 || px >= W) continue;
      const idx = (py * W + px) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
}

/** Fill an ellipse (used for shackles, end caps, charms). */
function fillEllipse(png, cx, cy, rx, ry, color) {
  const W = png.width, H = png.height;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const dx = (i - cx) / rx;
      const dy = (j - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const idx = (j * W + i) << 2;
        png.data[idx] = color[0];
        png.data[idx + 1] = color[1];
        png.data[idx + 2] = color[2];
        png.data[idx + 3] = color[3];
      }
    }
  }
}

/** Stroke a circle (ring) at (cx, cy) with outer radius r and thickness t. */
function strokeRing(png, cx, cy, r, t, color) {
  const W = png.width, H = png.height;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const dx = i - cx, dy = j - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= r - t && d <= r) {
        const idx = (j * W + i) << 2;
        png.data[idx] = color[0];
        png.data[idx + 1] = color[1];
        png.data[idx + 2] = color[2];
        png.data[idx + 3] = color[3];
      }
    }
  }
}

/** Filled rounded rectangle — shackle "bar". */
function fillRoundedBar(png, x, y, w, h, r, color) {
  fillRect(png, x + r, y, w - 2 * r, h, color);
  fillRect(png, x, y + r, w, h - 2 * r, color);
  fillEllipse(png, x + r, y + r, r, r, color);
  fillEllipse(png, x + w - r, y + r, r, r, color);
  fillEllipse(png, x + r, y + h - r, r, r, color);
  fillEllipse(png, x + w - r, y + h - r, r, r, color);
}

function newPng(w, h) {
  const png = new PNG({ width: w, height: h });
  // Fill transparent.
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }
  return png;
}

// ── Per-part drawing routines ───────────────────────────────────────────
// Each part draws on a 240×120 canvas (the "track" the bracelet rides on),
// and the icon is centered within that track. Visual width is roughly
// 120px max — what the preview lays out horizontally. The point of the
// pitch-based layout is that the *icon* can be 120px wide but only
// contribute 2.2mm to length. The link is visible, but not counted.

function drawEndCap(png, code) {
  // Rounded end cap with a thin stud ring.
  fillEllipse(png, 60, 60, 48, 48, INK);
  fillEllipse(png, 60, 60, 36, 36, GOLD);
  fillEllipse(png, 60, 60, 18, 18, GOLD_DARK);
  // Subtle highlight.
  fillEllipse(png, 50, 50, 6, 6, [240, 230, 200, 200]);
}

function drawShackle(png, code) {
  // Three connected rings.
  strokeRing(png, 50, 60, 28, 8, GOLD);
  strokeRing(png, 120, 60, 32, 9, GOLD);
  strokeRing(png, 190, 60, 28, 8, GOLD);
}

function drawModularLink(png, code) {
  // A "weave" — alternating horizontal/vertical bars.
  const y = 60;
  const barH = 12;
  fillRoundedBar(png, 16, y - barH, 208, barH * 2, 6, GOLD);
  // Cross-hatch lines.
  for (let i = 0; i < 5; i++) {
    const x = 40 + i * 40;
    fillRoundedBar(png, x - 2, 32, 4, 56, 2, GOLD_DARK);
  }
}

function drawConnector(png) {
  // A tiny gold dot — visible but pitch=0.
  fillEllipse(png, 60, 60, 12, 12, GOLD);
  fillEllipse(png, 56, 56, 4, 4, [255, 240, 200, 220]);
}

function drawHeart(png) {
  // Heart shape: two top circles + triangle bottom, drawn as a filled path
  // approximation with two filled circles + a filled rect.
  fillEllipse(png, 50, 50, 24, 24, ROSE);
  fillEllipse(png, 82, 50, 24, 24, ROSE);
  // Triangle: fill rows of the triangle.
  for (let y = 0; y < 60; y++) {
    const halfWidth = 36 - (y * 36) / 60;
    fillRect(png, 66 - halfWidth, 50 + y, halfWidth * 2, 1, ROSE);
  }
  // Highlight.
  fillEllipse(png, 44, 44, 5, 5, [255, 230, 220, 200]);
}

function drawDrop(png) {
  // Teardrop: filled circle on top, then a triangle down.
  fillEllipse(png, 66, 38, 22, 22, ROSE);
  for (let y = 0; y < 60; y++) {
    const halfWidth = 22 * (1 - y / 60);
    fillRect(png, 66 - halfWidth, 50 + y, halfWidth * 2, 1, ROSE);
  }
  fillEllipse(png, 60, 32, 4, 6, [255, 230, 220, 200]);
}

function drawStar(png) {
  // 5-point star approximated with a filled polygon — using small filled
  // rects along each edge. For a 120x120 canvas centered at (66, 60) with
  // outer radius 36, inner radius 16:
  const cx = 66, cy = 60, R = 36, r = 16;
  const points = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    points.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]);
  }
  // Fill the polygon with a scanline approach.
  for (let y = -R; y <= R; y++) {
    const py = cy + y;
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > py) !== (yj > py) && py >= 0 && py < png.height) {
        const t = (py - yi) / (yj - yi);
        const x = xi + t * (xj - xi);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (maxX >= minX && py >= 0 && py < png.height) {
      fillRect(png, Math.max(0, Math.floor(minX)), py, Math.min(png.width, Math.ceil(maxX - minX)), 1, ROSE);
    }
  }
}

function drawMoon(png) {
  // Crescent: filled gold circle, then a smaller ink-colored circle offset
  // to bite the shape into a crescent.
  fillEllipse(png, 70, 60, 38, 38, ROSE);
  fillEllipse(png, 84, 56, 32, 32, [255, 255, 255, 0]);
  // The "bite" needs to be a transparent wedge — approximate by filling
  // the same region as the canvas's background (which is transparent).
  // We can't do that with fillEllipse, so we just punch a second
  // transparent ellipse that cancels the previous fill.
  // (pngjs' data is RGBA; the simplest is to recompute the crescent path
  // by iterating every pixel inside the moon's bounding box.)
  const W = png.width, H = png.height;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const dxOuter = i - 70, dyOuter = j - 60;
      const dxInner = i - 84, dyInner = j - 56;
      const dO = Math.sqrt(dxOuter * dxOuter + dyOuter * dyOuter);
      const dI = Math.sqrt(dxInner * dxInner + dyInner * dyInner);
      if (dO <= 38 && dI <= 32) {
        const idx = (j * W + i) << 2;
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }
}

function drawDotAccent(png) {
  fillEllipse(png, 60, 60, 14, 14, GOLD);
  fillEllipse(png, 56, 56, 4, 4, [255, 240, 200, 220]);
}

function drawRingAccent(png) {
  strokeRing(png, 60, 60, 22, 6, GOLD);
  strokeRing(png, 60, 60, 12, 3, GOLD_DARK);
}

// ── Master drawing loop ────────────────────────────────────────────────

const W = 240, H = 120;

const parts = [
  { code: 'EC20', draw: drawEndCap },
  { code: 'SH22', draw: (p) => drawShackle(p, 'SH22') },
  { code: 'SH30', draw: (p) => drawShackle(p, 'SH30') },
  { code: 'SH35', draw: (p) => drawShackle(p, 'SH35') },
  { code: 'M28', draw: (p) => drawModularLink(p, 'M28') },
  { code: 'M40', draw: (p) => drawModularLink(p, 'M40') },
  { code: 'M55', draw: (p) => drawModularLink(p, 'M55') },
  { code: 'CN0', draw: drawConnector },
  { code: 'CH-HEART', draw: drawHeart },
  { code: 'CH-DROP', draw: drawDrop },
  { code: 'CH-STAR', draw: drawStar },
  { code: 'CH-MOON', draw: drawMoon },
  { code: 'AC-DOT', draw: drawDotAccent },
  { code: 'AC-RING', draw: drawRingAccent },
];

for (const { code, draw } of parts) {
  const png = newPng(W, H);
  draw(png, code);
  const buf = PNG.sync.write(png);
  const file = resolve(outDir, `${code}.png`);
  writeFileSync(file, buf);
  console.log(`wrote ${file}  (${buf.length} bytes)`);
}

console.log(`\nDone. ${parts.length} part assets in ${outDir}.`);
