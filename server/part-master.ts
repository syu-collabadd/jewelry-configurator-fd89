// Part Master — the single source of truth for approved parts.
// Every AI output must be a sequence of part_codes from this list.
//
// pitch/mm is the load-bearing number for length math.
// PNG width is for visual layout only — see the preview renderer.

import type { Part } from '../shared/types.js';

export const PART_MASTER: Part[] = [
  // ── End caps (bookends). Must be the first AND last part of every valid
  //    sequence so the bracelet has a proper closure.
  {
    part_code: 'EC20',
    name: 'Heritage End Cap',
    category: 'end_cap',
    assembly_pitch_mm: 2.0,
    png_width_px: 80,
    png_asset_url: '/assets/parts/EC20.png',
    description: 'Classic rounded end cap. Always used as the first and last part of a bracelet.',
    aesthetic_tags: ['simple', 'elegant', 'minimal', 'professional', 'vintage'],
  },

  // ── Shackles — the structural "spine" of the bracelet.
  {
    part_code: 'SH22',
    name: 'Slender Shackle',
    category: 'shackle',
    assembly_pitch_mm: 2.2,
    png_width_px: 72,
    png_asset_url: '/assets/parts/SH22.png',
    description: 'Thin cylindrical shackle. Versatile, reads as simple and elegant.',
    aesthetic_tags: ['simple', 'elegant', 'minimal', 'feminine', 'modern'],
  },
  {
    part_code: 'SH30',
    name: 'Classic Shackle',
    category: 'shackle',
    assembly_pitch_mm: 3.0,
    png_width_px: 88,
    png_asset_url: '/assets/parts/SH30.png',
    description: 'Standard shackle. The workhorse link of the bracelet.',
    aesthetic_tags: ['simple', 'professional', 'masculine', 'modern'],
  },
  {
    part_code: 'SH35',
    name: 'Bold Shackle',
    category: 'shackle',
    assembly_pitch_mm: 3.5,
    png_width_px: 96,
    png_asset_url: '/assets/parts/SH35.png',
    description: 'Thicker shackle with more visual weight.',
    aesthetic_tags: ['bold', 'statement', 'masculine', 'modern'],
  },

  // ── Modular links — decorative mid-sections.
  {
    part_code: 'M28',
    name: 'Slim Module',
    category: 'modular_link',
    assembly_pitch_mm: 2.8,
    png_width_px: 84,
    png_asset_url: '/assets/parts/M28.png',
    description: 'Slim decorative link. Reads as elegant and subtle.',
    aesthetic_tags: ['elegant', 'subtle', 'minimal', 'feminine', 'meaningful'],
  },
  {
    part_code: 'M40',
    name: 'Woven Module',
    category: 'modular_link',
    assembly_pitch_mm: 4.0,
    png_width_px: 100,
    png_asset_url: '/assets/parts/M40.png',
    description: 'Woven-texture mid-link. Adds visual rhythm without being loud.',
    aesthetic_tags: ['elegant', 'romantic', 'meaningful', 'vintage'],
  },
  {
    part_code: 'M55',
    name: 'Architectural Module',
    category: 'modular_link',
    assembly_pitch_mm: 5.5,
    png_width_px: 112,
    png_asset_url: '/assets/parts/M55.png',
    description: 'Geometric mid-link. Reads modern and confident.',
    aesthetic_tags: ['bold', 'modern', 'statement', 'masculine'],
  },

  // ── Connectors — the link is *visible* in the PNG, but its pitch is 0,
  //    so it adds no length to the bracelet. This is the whole point of
  //    pitch-based sizing: the connector shows up visually but doesn't
  //    inflate the length math.
  {
    part_code: 'CN0',
    name: 'Hidden Connector',
    category: 'connector',
    assembly_pitch_mm: 0,
    png_width_px: 36,
    png_asset_url: '/assets/parts/CN0.png',
    description: 'Visual link between two parts. Visible in the PNG but contributes 0 mm of length.',
    aesthetic_tags: ['subtle', 'minimal', 'modern'],
  },

  // ── Charms — the focal pieces.
  {
    part_code: 'CH-HEART',
    name: 'Heart Charm',
    category: 'charm',
    assembly_pitch_mm: 4.2,
    png_width_px: 104,
    png_asset_url: '/assets/parts/CH-HEART.png',
    description: 'Heart-shaped charm. Reads as romantic, meaningful, feminine.',
    aesthetic_tags: ['romantic', 'meaningful', 'feminine', 'playful'],
  },
  {
    part_code: 'CH-DROP',
    name: 'Drop Charm',
    category: 'charm',
    assembly_pitch_mm: 5.0,
    png_width_px: 112,
    png_asset_url: '/assets/parts/CH-DROP.png',
    description: 'Teardrop charm. Elegant, romantic, and slightly vintage.',
    aesthetic_tags: ['romantic', 'elegant', 'vintage', 'feminine', 'meaningful'],
  },
  {
    part_code: 'CH-STAR',
    name: 'Star Charm',
    category: 'charm',
    assembly_pitch_mm: 4.4,
    png_width_px: 108,
    png_asset_url: '/assets/parts/CH-STAR.png',
    description: 'Star charm. Playful, modern, statement-making.',
    aesthetic_tags: ['playful', 'modern', 'statement', 'bold'],
  },
  {
    part_code: 'CH-MOON',
    name: 'Crescent Charm',
    category: 'charm',
    assembly_pitch_mm: 4.6,
    png_width_px: 108,
    png_asset_url: '/assets/parts/CH-MOON.png',
    description: 'Crescent moon charm. Meaningful, elegant, slightly mystical.',
    aesthetic_tags: ['meaningful', 'elegant', 'feminine', 'vintage'],
  },

  // ── Accents — small visual highlights.
  {
    part_code: 'AC-DOT',
    name: 'Dot Accent',
    category: 'accent',
    assembly_pitch_mm: 1.6,
    png_width_px: 56,
    png_asset_url: '/assets/parts/AC-DOT.png',
    description: 'A tiny stud accent. Subtle rhythm marker.',
    aesthetic_tags: ['subtle', 'minimal', 'modern'],
  },
  {
    part_code: 'AC-RING',
    name: 'Ring Accent',
    category: 'accent',
    assembly_pitch_mm: 2.4,
    png_width_px: 64,
    png_asset_url: '/assets/parts/AC-RING.png',
    description: 'A small ring accent. Slight vintage feel.',
    aesthetic_tags: ['vintage', 'elegant', 'feminine'],
  },
];

export const PART_MASTER_BY_CODE: ReadonlyMap<string, Part> = new Map(
  PART_MASTER.map((p) => [p.part_code, p]),
);

export function getPart(code: string): Part | undefined {
  return PART_MASTER_BY_CODE.get(code);
}
