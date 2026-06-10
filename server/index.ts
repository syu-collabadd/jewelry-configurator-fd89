// TENLUMA backend.
//
// Path B service: binds to :: on process.env.PORT (Burrow injects 8046).
// Serves /api/* and the built Vite client from ../dist.

import 'dotenv/config';

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { PART_MASTER, getPart } from './part-master.js';
import { validateSequence } from './validation.js';
import { createInterpreter } from './ai.js';
import type {
  ConfigurationResult,
  ConfigureRequest,
  Part,
  PartCodeSequence,
} from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

// ── API ────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tenluma-configurator',
    parts: PART_MASTER.length,
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
});

app.get('/api/parts', (_req, res) => {
  res.json({ parts: PART_MASTER });
});

app.post('/api/validate', (req, res) => {
  const body = req.body as Partial<PartCodeSequence> | undefined;
  if (!body || !Array.isArray(body.parts)) {
    return res.status(400).json({ error: 'Body must be { parts: string[] }' });
  }
  const result = validateSequence(body.parts);
  res.json(result);
});

const interpreter = createInterpreter(PART_MASTER);

app.post('/api/configure', async (req, res, next) => {
  try {
    const body = req.body as Partial<ConfigureRequest> | undefined;
    const story = body?.story?.trim();
    if (!story) {
      return res.status(400).json({ error: 'story is required' });
    }
    if (story.length > 2000) {
      return res.status(400).json({ error: 'story is too long (max 2000 chars)' });
    }

    const { result: interpretation, usedRealAi } = await interpreter.interpret(story);
    const validation = validateSequence(interpretation.part_code_sequence);

    // Resolve parts for the frontend. If validation failed because of unknown
    // codes, the resolver will return undefined for those — surface them.
    const resolved: Part[] = [];
    for (const code of interpretation.part_code_sequence) {
      const p = getPart(code);
      if (p) resolved.push(p);
    }

    // Length is the sum of assembly_pitch_mm. Connectors contribute 0 — by
    // design. The link is visible in the PNG, but not counted in length.
    const total_length_mm = resolved.reduce(
      (acc, p) => acc + p.assembly_pitch_mm,
      0,
    );

    const whatsapp_summary = buildWhatsAppSummary({
      designName: interpretation.design_name,
      tags: interpretation.interpretation_tags,
      partCodeSequence: interpretation.part_code_sequence,
      resolvedParts: resolved,
      totalLengthMm: total_length_mm,
      passed: validation.passed,
      issues: validation.issues,
    });

    const response: ConfigurationResult = {
      interpretation,
      validation,
      resolved_parts: resolved,
      total_length_mm,
      whatsapp_summary,
      used_real_ai: usedRealAi,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ── Static frontend (production) ───────────────────────────────────────

const clientDir = path.resolve(__dirname, '..', '..', 'dist');
if (existsSync(clientDir)) {
  app.use(express.static(clientDir, { maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('text/plain')
      .send(
        'TENLUMA API. The Vite client has not been built yet — run `npm run build` from the project root.',
      );
  });
}

// ── Error handler ──────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message =
    err instanceof Error ? err.message : 'Unknown server error.';
  console.error('[tenluma] error:', err);
  res.status(500).json({ error: message });
});

// ── Listen on ::, PORT from env (Burrow Path B) ────────────────────────

const port = Number.parseInt(process.env.PORT ?? '8046', 10);
app.listen(port, '::', () => {
  console.log(
    `[tenluma] listening on [::]:${port}  parts=${PART_MASTER.length}  openai=${Boolean(
      process.env.OPENAI_API_KEY?.trim(),
    )}`,
  );
});

// ── Helpers ────────────────────────────────────────────────────────────

interface SummaryInput {
  designName: string;
  tags: string[];
  partCodeSequence: string[];
  resolvedParts: Part[];
  totalLengthMm: number;
  passed: boolean;
  issues: string[];
}

function buildWhatsAppSummary(input: SummaryInput): string {
  const codes = input.partCodeSequence.join(' - ');
  const tagList = input.tags.length > 0 ? input.tags.join(', ') : '—';
  const status = input.passed
    ? '✅ Validation: Passed'
    : `⚠️ Validation: Issues (${input.issues.length})`;

  const lines = [
    `*TENLUMA — Modular Jewelry Inquiry*`,
    ``,
    `Design: *${input.designName}*`,
    `Style: ${tagList}`,
    `Length: *${input.totalLengthMm.toFixed(1)} mm*`,
    `Parts: ${input.partCodeSequence.length}`,
    ``,
    `Sequence:`,
    codes,
    ``,
    status,
  ];
  if (!input.passed) {
    lines.push(``, `Notes: ${input.issues.join('; ')}`);
  }
  lines.push(
    ``,
    `This design is built entirely from approved TENLUMA parts. Reply to confirm sizing and we'll begin production.`,
  );
  return lines.join('\n');
}
