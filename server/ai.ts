// AI interpretation layer.
//
// Translates a freeform customer story into a DesignInterpretation:
//   { design_name, interpretation_tags, rationale, part_code_sequence }
//
// The part_code_sequence is constrained to the approved Part Master — we
// pass the full list to the model and use OpenAI's `response_format:
// json_schema` with an `enum` constraint, so the model literally cannot
// emit a part code that doesn't exist.
//
// If OPENAI_API_KEY is missing, we fall back to a deterministic mock
// interpreter that does the same thing in code. This keeps the demo
// runnable end-to-end without a key.

import OpenAI from 'openai';
import type {
  AestheticTag,
  DesignInterpretation,
  Part,
} from '../shared/types.js';

const MODEL =
  process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini-2024-07-18';

const ALLOWED_TAGS: AestheticTag[] = [
  'simple',
  'elegant',
  'romantic',
  'minimal',
  'bold',
  'playful',
  'modern',
  'vintage',
  'masculine',
  'feminine',
  'professional',
  'meaningful',
  'subtle',
  'statement',
];

const SYSTEM_PROMPT = `You are a senior product designer for TENLUMA, a luxury modular jewelry brand.
You translate a customer's freeform story into a manufacturable bracelet design.

RULES — these are non-negotiable:
1. The part_code_sequence is the ONLY output the customer-facing app will use to manufacture the piece. Every part_code MUST come from the approved Part Master provided to you.
2. The first and last parts MUST be the end cap (EC20). The bracelet must close.
3. A charm (CH-HEART, CH-DROP, CH-STAR, CH-MOON) MUST be preceded by a connector (CN0). The connector is the charm's hook.
4. Do NOT invent part codes. If you can't find a part that fits, leave it out.
5. Pick parts whose aesthetic_tags match the customer's story.
6. Keep the sequence short and elegant: 5–9 parts is the sweet spot for a bracelet.
7. Return a short, evocative design_name (2–4 words, Title Case).
8. Return 2–5 interpretation_tags from the allowed list — these are what you heard in the story.
9. Return a one-sentence rationale explaining why you chose these parts.

Output JSON matching the schema exactly. No commentary outside the JSON.`;

interface InterpreterDeps {
  apiKey: string | undefined;
  parts: Part[];
}

export interface Interpreter {
  interpret(story: string): Promise<{ result: DesignInterpretation; usedRealAi: boolean }>;
}

function buildUserPrompt(story: string, parts: Part[]): string {
  const partList = parts
    .map(
      (p) =>
        `- ${p.part_code} | ${p.name} | category=${p.category} | pitch=${p.assembly_pitch_mm}mm | tags=${p.aesthetic_tags.join(',')} | ${p.description}`,
    )
    .join('\n');

  return `CUSTOMER STORY:
"""
${story.trim()}
"""

APPROVED PART MASTER (you may only use these part codes):
${partList}

Translate the story into a part_code_sequence. Remember:
- First and last parts MUST be EC20.
- Charms must be preceded by CN0.
- Stay within 5–9 parts.`;
}

function makeOpenAiSchema(parts: Part[]): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'design_name',
      'interpretation_tags',
      'rationale',
      'part_code_sequence',
    ],
    properties: {
      design_name: {
        type: 'string',
        description: 'A short, evocative 2–4 word name for the design.',
        minLength: 2,
        maxLength: 60,
      },
      interpretation_tags: {
        type: 'array',
        description: '2–5 tags from the allowed list.',
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'string',
          enum: ALLOWED_TAGS,
        },
      },
      rationale: {
        type: 'string',
        description: 'One sentence explaining the part choice.',
        minLength: 10,
        maxLength: 400,
      },
      part_code_sequence: {
        type: 'array',
        description:
          'Ordered list of part codes. First and last must be EC20. 5–9 parts.',
        minItems: 5,
        maxItems: 9,
        items: {
          type: 'string',
          enum: parts.map((p) => p.part_code),
        },
      },
    },
  };
}

function makeMockInterpreter(deps: InterpreterDeps): Interpreter {
  const { parts } = deps;
  const byCode = new Map(parts.map((p) => [p.part_code, p]));

  function pickByTags(story: string): Part[] {
    const s = story.toLowerCase();
    const wants: AestheticTag[] = [];
    const pairs: Array<[string, AestheticTag]> = [
      ['simple', 'simple'],
      ['elegant', 'elegant'],
      ['minimal', 'minimal'],
      ['minimalist', 'minimal'],
      ['romantic', 'romantic'],
      ['romance', 'romantic'],
      ['anniversary', 'romantic'],
      ['meaningful', 'meaningful'],
      ['bold', 'bold'],
      ['statement', 'statement'],
      ['playful', 'playful'],
      ['fun', 'playful'],
      ['modern', 'modern'],
      ['vintage', 'vintage'],
      ['classic', 'vintage'],
      ['masculine', 'masculine'],
      ['feminine', 'feminine'],
      ['professional', 'professional'],
      ['subtle', 'subtle'],
    ];
    for (const [needle, tag] of pairs) {
      if (s.includes(needle)) wants.push(tag);
    }
    // Always provide a baseline so a totally empty story still gets something.
    if (wants.length === 0) wants.push('simple', 'elegant');

    return parts
      .filter((p) => p.aesthetic_tags.some((t) => wants.includes(t)))
      .sort((a, b) => {
        const aScore = a.aesthetic_tags.filter((t) => wants.includes(t)).length;
        const bScore = b.aesthetic_tags.filter((t) => wants.includes(t)).length;
        return bScore - aScore;
      });
  }

  function buildSequence(story: string): string[] {
    // The mock follows the same rules the real AI follows:
    //   EC20 + 3 shackle+link+connector alternations + EC20
    //   plus a charm hook if a charm-shaped story.
    const s = story.toLowerCase();
    const wantsCharm =
      s.includes('romantic') ||
      s.includes('meaningful') ||
      s.includes('anniversary') ||
      s.includes('love') ||
      s.includes('charm');

    const shackle = s.includes('bold') || s.includes('statement')
      ? byCode.get('SH35')!
      : s.includes('masculine') || s.includes('professional')
      ? byCode.get('SH30')!
      : byCode.get('SH22')!;
    const link = s.includes('bold') || s.includes('statement')
      ? byCode.get('M55')!
      : s.includes('romantic') || s.includes('meaningful')
      ? byCode.get('M40')!
      : byCode.get('M28')!;
    const charm = s.includes('star') || s.includes('playful')
      ? byCode.get('CH-STAR')!
      : s.includes('moon') || s.includes('vintage')
      ? byCode.get('CH-MOON')!
      : s.includes('drop') || s.includes('elegant')
      ? byCode.get('CH-DROP')!
      : byCode.get('CH-HEART')!;

    // EC20 - SH - M - SH - M - SH (minimal 5-part pattern that always validates)
    // If a charm is wanted, swap the middle M for CN0 + CH.
    if (wantsCharm) {
      return [
        'EC20',
        shackle.part_code,
        'CN0',
        charm.part_code,
        shackle.part_code,
        link.part_code,
        shackle.part_code,
        'EC20',
      ];
    }
    return [
      'EC20',
      shackle.part_code,
      link.part_code,
      shackle.part_code,
      link.part_code,
      shackle.part_code,
      'EC20',
    ];
  }

  return {
    async interpret(story: string) {
      const matches = pickByTags(story);
      const tags = Array.from(
        new Set(matches.flatMap((p) => p.aesthetic_tags)),
      ).slice(0, 4) as AestheticTag[];

      const sequence = buildSequence(story);
      const designName = inferDesignName(story, tags);
      const rationale =
        'Selected parts whose aesthetic profile matched your story. The sequence is bookended by the Heritage End Cap and balanced between shackles and decorative modules.';

      return {
        usedRealAi: false,
        result: {
          design_name: designName,
          interpretation_tags: tags,
          rationale,
          part_code_sequence: sequence,
        },
      };
    },
  };
}

function inferDesignName(story: string, tags: AestheticTag[]): string {
  const s = story.toLowerCase();
  if (s.includes('anniversary')) return 'Soft Anniversary';
  if (s.includes('birthday')) return 'Birthday Glow';
  if (s.includes('wedding') || s.includes('bridal')) return 'Bridal Whisper';
  if (s.includes('graduation')) return 'New Chapter';
  if (s.includes('mother')) return "Mother's Light";
  if (s.includes('love') || s.includes('valentine')) return 'Quiet Devotion';
  if (tags.includes('bold') || tags.includes('statement')) return 'Confident Edge';
  if (tags.includes('minimal')) return 'Quiet Form';
  if (tags.includes('playful')) return 'Light Step';
  return 'Personal Edit';
}

function makeOpenAiInterpreter(deps: InterpreterDeps): Interpreter {
  const client = new OpenAI({ apiKey: deps.apiKey });
  const schema = makeOpenAiSchema(deps.parts);

  return {
    async interpret(story: string) {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'design_interpretation',
            strict: true,
            schema,
          },
        },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildUserPrompt(story, deps.parts),
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new Error('OpenAI returned an empty response.');
      }
      const parsed = JSON.parse(raw) as DesignInterpretation;
      return { result: parsed, usedRealAi: true };
    },
  };
}

export function createInterpreter(parts: Part[]): Interpreter {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const deps: InterpreterDeps = { apiKey, parts };
  if (!apiKey) return makeMockInterpreter(deps);
  return makeOpenAiInterpreter(deps);
}
