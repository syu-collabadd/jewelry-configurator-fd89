// Validation engine for a part-code sequence.
//
// Rules (intentionally simple for the POC, but enough to demonstrate the
// concept of a rules-based configurator):
//
//   1. Every part_code must exist in the Part Master.
//   2. Sequence length must be 3–15 parts (inclusive).
//   3. The first and last part must be an end_cap.
//   4. A charm must be preceded by a connector (CN0). This is the
//      "charm needs a hook" rule — it forces the LLM to interleave
//      connectors with charms if it wants focal pieces.
//   5. No three connectors in a row — keeps the preview visually balanced.
//   6. No three charms in a row — same reason.
//   7. The connector (CN0) is a *visual* link. It contributes 0 mm to the
//      length, but it is still a real part in the sequence. Connectors
//      cannot be at positions 0 or N-1 (those are reserved for end caps).
//
// All issues are reported back; the engine never throws. A passed sequence
// has zero issues.

import { getPart } from './part-master.js';
import type { ValidationResult } from '../shared/types.js';

export interface ValidateOptions {
  /** Minimum sequence length (inclusive). */
  min_length?: number;
  /** Maximum sequence length (inclusive). */
  max_length?: number;
}

const DEFAULT_OPTS: Required<ValidateOptions> = {
  min_length: 3,
  max_length: 15,
};

export function validateSequence(
  codes: string[],
  opts: ValidateOptions = {},
): ValidationResult {
  const o = { ...DEFAULT_OPTS, ...opts };
  const issues: string[] = [];

  if (!Array.isArray(codes) || codes.length === 0) {
    return { passed: false, issues: ['Sequence is empty.'] };
  }

  // Rule 2: length.
  if (codes.length < o.min_length) {
    issues.push(
      `Sequence is too short (${codes.length} parts). Minimum is ${o.min_length}.`,
    );
  }
  if (codes.length > o.max_length) {
    issues.push(
      `Sequence is too long (${codes.length} parts). Maximum is ${o.max_length}.`,
    );
  }

  // Rule 1: every code must exist.
  const resolved = codes.map((c) => ({ code: c, part: getPart(c) }));
  for (const { code, part } of resolved) {
    if (!part) {
      issues.push(`Unknown part code: "${code}".`);
    }
  }

  // If any part is unknown, downstream rules are unreliable. Stop here.
  if (issues.length > 0) {
    return { passed: false, issues };
  }

  // Rule 3: end caps at both ends.
  const first = resolved[0].part!;
  const last = resolved[resolved.length - 1].part!;
  if (first.category !== 'end_cap') {
    issues.push(
      `First part must be an end cap (got ${first.category}: ${first.part_code}).`,
    );
  }
  if (last.category !== 'end_cap') {
    issues.push(
      `Last part must be an end cap (got ${last.category}: ${last.part_code}).`,
    );
  }

  // Rule 7: connectors cannot be at the ends.
  for (let i = 0; i < resolved.length; i++) {
    const isEnd = i === 0 || i === resolved.length - 1;
    if (isEnd && resolved[i].part!.category === 'connector') {
      issues.push(
        `Connector ${resolved[i].part!.part_code} cannot be at position ${i} (end positions must be end caps).`,
      );
    }
  }

  // Rule 4: a charm must be preceded by a connector (hook).
  for (let i = 1; i < resolved.length; i++) {
    if (resolved[i].part!.category === 'charm') {
      const prev = resolved[i - 1].part!;
      if (prev.category !== 'connector') {
        issues.push(
          `Charm ${resolved[i].part!.part_code} at position ${i} must be preceded by a connector (got ${prev.category}: ${prev.part_code}).`,
        );
      }
    }
  }

  // Rule 5: no three connectors in a row.
  for (let i = 2; i < resolved.length; i++) {
    const a = resolved[i - 2].part!.category;
    const b = resolved[i - 1].part!.category;
    const c = resolved[i].part!.category;
    if (a === 'connector' && b === 'connector' && c === 'connector') {
      issues.push(
        `Three connectors in a row at positions ${i - 2}-${i - 1}-${i}.`,
      );
      break;
    }
  }

  // Rule 6: no three charms in a row.
  for (let i = 2; i < resolved.length; i++) {
    const a = resolved[i - 2].part!.category;
    const b = resolved[i - 1].part!.category;
    const c = resolved[i].part!.category;
    if (a === 'charm' && b === 'charm' && c === 'charm') {
      issues.push(
        `Three charms in a row at positions ${i - 2}-${i - 1}-${i}.`,
      );
      break;
    }
  }

  return { passed: issues.length === 0, issues };
}
