import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchParts } from '../lib/api';
import type { Part, PartCategory } from '../../shared/types';

const CATEGORY_LABELS: Record<PartCategory, string> = {
  end_cap: 'End cap',
  shackle: 'Shackle',
  modular_link: 'Modular link',
  connector: 'Connector',
  charm: 'Charm',
  accent: 'Accent',
};

const CATEGORY_ORDER: PartCategory[] = [
  'end_cap',
  'shackle',
  'modular_link',
  'connector',
  'charm',
  'accent',
];

export function PartMasterPage() {
  const [parts, setParts] = useState<Part[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchParts()
      .then(setParts)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="mb-6 flex items-center gap-3 text-sm">
        <Link to="/" className="text-ink-500 hover:text-ink-900">
          ← Back
        </Link>
        <span className="text-ink-300">/</span>
        <span className="text-ink-700">Part Master</span>
      </div>

      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tightest text-ink-900 sm:text-5xl">
          Part Master
        </h1>
        <p className="mt-4 text-base text-ink-500">
          The single source of truth. The AI may only output sequences of part
          codes from this list. Each part carries an
          {' '}<span className="font-mono">assembly_pitch_mm</span> that drives
          the total-length math — the PNG width is for visual layout only.
        </p>
      </div>

      {err ? (
        <div className="mt-8 text-sm text-red-600">{err}</div>
      ) : !parts ? (
        <div className="mt-12 text-sm text-ink-500">Loading…</div>
      ) : (
        <div className="mt-10 space-y-10">
          {CATEGORY_ORDER.map((cat) => {
            const inCat = parts.filter((p) => p.category === cat);
            if (inCat.length === 0) return null;
            return (
              <section key={cat}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-700">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="text-xs text-ink-500">
                    {inCat.length} part{inCat.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {inCat.map((p) => (
                    <PartCard key={p.part_code} part={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PartCard({ part }: { part: Part }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ink-50/60">
        <img
          src={part.png_asset_url}
          alt={part.name}
          className="h-14 w-14 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-ink-900">
            {part.part_code}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              part.assembly_pitch_mm === 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-ink-50 text-ink-700'
            }`}
          >
            {part.assembly_pitch_mm === 0 ? '0 mm · link' : `${part.assembly_pitch_mm} mm`}
          </span>
        </div>
        <div className="mt-0.5 text-sm font-medium text-ink-700">
          {part.name}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-ink-500">
          {part.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {part.aesthetic_tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
