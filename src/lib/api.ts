import type { ConfigurationResult, Part } from '../../shared/types';

export async function fetchParts(): Promise<Part[]> {
  const r = await fetch('/api/parts');
  if (!r.ok) throw new Error(`Failed to load parts: ${r.status}`);
  const j = (await r.json()) as { parts: Part[] };
  return j.parts;
}

export async function configure(story: string): Promise<ConfigurationResult> {
  const r = await fetch('/api/configure', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ story }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${r.status}`);
  }
  return r.json() as Promise<ConfigurationResult>;
}
