// Shared types for the TENLUMA configurator.
// Used by both the Express server and the React client.

export type PartCategory =
  | 'end_cap'
  | 'shackle'
  | 'modular_link'
  | 'connector'
  | 'charm'
  | 'accent';

export type AestheticTag =
  | 'simple'
  | 'elegant'
  | 'romantic'
  | 'minimal'
  | 'bold'
  | 'playful'
  | 'modern'
  | 'vintage'
  | 'masculine'
  | 'feminine'
  | 'professional'
  | 'meaningful'
  | 'subtle'
  | 'statement';

export interface Part {
  /** Stable identifier, e.g. "SH22". Must be unique. */
  part_code: string;
  /** Human-readable name shown in the UI. */
  name: string;
  /** Functional category — drives validation rules. */
  category: PartCategory;
  /** Pitch in millimetres contributed to the assembled bracelet length. */
  assembly_pitch_mm: number;
  /** Visual width in pixels of the PNG asset. Used to lay out the preview. */
  png_width_px: number;
  /** Public path to the transparent PNG asset. */
  png_asset_url: string;
  /** Optional description used by the LLM when picking a part. */
  description: string;
  /** Aesthetic tags the LLM can match on. */
  aesthetic_tags: AestheticTag[];
}

export interface PartCodeSequence {
  parts: string[];
}

export interface ValidationResult {
  passed: boolean;
  issues: string[];
}

export interface DesignInterpretation {
  /** AI-generated short name for the design. */
  design_name: string;
  /** Short, comma-separated tag list the AI extracted from the customer story. */
  interpretation_tags: AestheticTag[];
  /** AI's reasoning paragraph (one or two sentences). */
  rationale: string;
  /** Sequence of part codes from the approved Part Master only. */
  part_code_sequence: string[];
}

export interface ConfigurationResult {
  interpretation: DesignInterpretation;
  validation: ValidationResult;
  /** Resolved parts (with metadata) in assembly order. */
  resolved_parts: Part[];
  /** Sum of assembly_pitch_mm across the sequence. */
  total_length_mm: number;
  /** Ready-to-send WhatsApp inquiry text. */
  whatsapp_summary: string;
  /** Whether the AI used a real LLM (true) or the deterministic mock (false). */
  used_real_ai: boolean;
}

export interface ConfigureRequest {
  story: string;
}
