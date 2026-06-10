import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BraceletPreview } from '../components/BraceletPreview';
import type { ConfigurationResult } from '../../shared/types';

export function ResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ConfigurationResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('tenluma:last');
    if (!raw) {
      navigate('/', { replace: true });
      return;
    }
    try {
      setResult(JSON.parse(raw) as ConfigurationResult);
    } catch {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-ink-500">
        Loading…
      </div>
    );
  }

  const { interpretation, validation, resolved_parts, total_length_mm, whatsapp_summary, used_real_ai } = result;

  async function copyWhatsApp() {
    try {
      await navigator.clipboard.writeText(whatsapp_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — user can manually copy
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <div className="mb-6 flex items-center gap-3 text-sm">
        <Link to="/" className="text-ink-500 hover:text-ink-900">
          ← Back
        </Link>
        <span className="text-ink-300">/</span>
        <span className="text-ink-700">Result</span>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-amber-500">
            Configured design
          </div>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tightest text-ink-900 sm:text-5xl">
            {interpretation.design_name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {interpretation.interpretation_tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-xs text-ink-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  used_real_ai ? 'bg-emerald-500' : 'bg-ink-300'
                }`}
              />
              {used_real_ai ? 'OpenAI' : 'Mock interpreter'}
            </span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs uppercase tracking-wider text-ink-500">
            Total length
          </div>
          <div className="mt-1 font-display text-3xl font-semibold tracking-tightest text-ink-900">
            {total_length_mm.toFixed(1)}
            <span className="ml-1 text-base font-medium text-ink-500">mm</span>
          </div>
          <div className="text-xs text-ink-500">
            sum of assembly_pitch_mm · {resolved_parts.length} parts
          </div>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-base text-ink-500">
        {interpretation.rationale}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-500">
                Preview
              </div>
              <div className="text-sm font-semibold text-ink-900">
                Straight bracelet, laid out by pitch
              </div>
            </div>
            <div className="text-xs text-ink-500">
              {PX_PER_MM} px / mm
            </div>
          </div>
          <BraceletPreview parts={resolved_parts} />
          <div className="mt-4 text-xs text-ink-500">
            Parts are positioned by <span className="font-mono">assembly_pitch_mm</span>,
            not by PNG pixel width. The connector (CN0) is visible in the
            preview but contributes 0 mm to the total.
          </div>
        </section>

        <section className="card lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-ink-500">
            Validation
          </div>
          <div className="mt-2 flex items-center gap-2">
            {validation.passed ? (
              <PassBadge />
            ) : (
              <FailBadge issues={validation.issues.length} />
            )}
            <div className="text-sm font-semibold text-ink-900">
              {validation.passed ? 'Passed' : 'Failed'}
            </div>
          </div>
          {validation.issues.length > 0 ? (
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-ink-700">
              {validation.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-500">
              All rules satisfied: end caps in place, no three of a kind, and
              every part code is in the master.
            </p>
          )}

          <div className="mt-6 text-xs uppercase tracking-wider text-ink-500">
            Sequence
          </div>
          <div className="mt-2 font-mono text-sm leading-relaxed text-ink-900">
            {interpretation.part_code_sequence.join(' - ')}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {resolved_parts.map((p, i) => (
              <div
                key={`${p.part_code}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-ink-100 bg-white p-2"
              >
                <img
                  src={p.png_asset_url}
                  alt={p.name}
                  className="h-6 w-6 object-contain"
                />
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs text-ink-900">
                    {p.part_code}
                  </div>
                  <div className="truncate text-[10px] text-ink-500">
                    {p.assembly_pitch_mm}mm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 card">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500">
              WhatsApp inquiry
            </div>
            <div className="text-sm font-semibold text-ink-900">
              Ready to send summary
            </div>
          </div>
          <button
            type="button"
            onClick={copyWhatsApp}
            className="btn-secondary"
          >
            {copied ? 'Copied' : 'Copy text'}
          </button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-lg border border-ink-100 bg-ink-50/40 p-4 font-mono text-xs leading-relaxed text-ink-900">
{whatsapp_summary}
        </pre>
      </section>
    </div>
  );
}

const PX_PER_MM = 8;

function PassBadge() {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-emerald-100 px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
      ✓
    </span>
  );
}
function FailBadge({ issues }: { issues: number }) {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-red-100 px-2 text-[10px] font-semibold uppercase tracking-wider text-red-700">
      ! {issues}
    </span>
  );
}
