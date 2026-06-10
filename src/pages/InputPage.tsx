import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { configure } from '../lib/api';
import type { ConfigurationResult } from '../../shared/types';

const EXAMPLES = [
  {
    label: 'Anniversary',
    text: 'For our anniversary, I want something simple, elegant, and meaningful.',
  },
  {
    label: 'Bold everyday',
    text: 'A bold modern bracelet for daily wear — something with a confident, masculine edge.',
  },
  {
    label: 'Playful gift',
    text: 'A playful, fun bracelet for my sister\'s birthday. Modern, light, a little statement.',
  },
  {
    label: 'Vintage romantic',
    text: 'I want a romantic, vintage-inspired piece — feminine, elegant, with a small charm.',
  },
];

export function InputPage() {
  const navigate = useNavigate();
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!story.trim()) {
      setError('Tell us a little about the piece you want.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result: ConfigurationResult = await configure(story);
      // Stash on sessionStorage so the Result page can render without
      // re-running the AI (and so a hard refresh of /result doesn't lose
      // the result).
      sessionStorage.setItem('tenluma:last', JSON.stringify(result));
      navigate('/result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-ink-50/60 px-3 py-1 text-xs text-ink-500">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Configurator — POC v1
      </div>
      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-ink-900 sm:text-5xl">
        Describe the piece you want.
        <br />
        <span className="text-ink-500">We&rsquo;ll build it from approved parts.</span>
      </h1>
      <p className="mt-5 max-w-xl text-base text-ink-500">
        A short story is enough. The configurator translates it into a sequence
        of parts from the TENLUMA master, validates it, and previews the
        bracelet. No AI-generated images — every part is real and
        manufacturable.
      </p>

      <form onSubmit={onSubmit} className="mt-10">
        <label className="block text-sm font-medium text-ink-700">
          Your story
        </label>
        <textarea
          className="field mt-2 min-h-[140px] resize-y"
          placeholder="For our anniversary, I want something simple, elegant, and meaningful…"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          disabled={loading}
        />
        {error ? (
          <div className="mt-3 text-sm text-red-600">{error}</div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !story.trim()}
          >
            {loading ? 'Configuring…' : 'Configure bracelet'}
            <Arrow />
          </button>
          <span className="text-xs text-ink-500">
            Takes about 2 seconds.
          </span>
        </div>
      </form>

      <div className="mt-12">
        <div className="mb-3 text-xs uppercase tracking-wider text-ink-500">
          Or try one of these
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="group flex flex-col rounded-xl border border-ink-100 bg-white p-4 text-left transition hover:border-ink-300 hover:bg-ink-50/40"
              onClick={() => setStory(ex.text)}
              disabled={loading}
            >
              <div className="text-xs font-medium uppercase tracking-wider text-amber-500">
                {ex.label}
              </div>
              <div className="mt-1 text-sm text-ink-700 group-hover:text-ink-900">
                {ex.text}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Pill
          kicker="01"
          title="Interpret"
          text="Your story becomes design intent — tags like elegant, romantic, bold."
        />
        <Pill
          kicker="02"
          title="Sequence"
          text="AI picks part codes from the approved master. Nothing invented."
        />
        <Pill
          kicker="03"
          title="Validate + preview"
          text="Rules check the sequence. Pitch in mm drives the length math."
        />
      </div>
    </div>
  );
}

function Pill({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="font-mono text-xs text-ink-300">{kicker}</div>
      <div className="mt-1 text-sm font-semibold text-ink-900">{title}</div>
      <div className="mt-1 text-xs text-ink-500">{text}</div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 7h10M8 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
