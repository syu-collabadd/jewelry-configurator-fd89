import { type Part } from '../../shared/types';

// ── Bracelet preview ───────────────────────────────────────────────────
//
// CRITICAL: positioning is by assembly_pitch_mm, NOT by PNG pixel width.
// The link/connector is visible in the PNG asset, but its pitch is 0 mm,
// so the connector is rendered at the same x-position as the previous part
// (it just visually overlaps). The link is visible, but not counted as
// length.
//
// Layout algorithm:
//   x[0] = 0
//   x[i] = x[i-1] + assembly_pitch_mm[i]   (in mm)
//
// Then everything is multiplied by PX_PER_MM to get pixel positions on
// the canvas.

const PX_PER_MM = 8;     // 1mm = 8px in the preview canvas
const PART_HEIGHT = 96;  // fixed rendered height of every part PNG
const MIN_TRACK_PX = 600; // minimum canvas width
const RULER_HEIGHT = 22;

interface BraceletPreviewProps {
  parts: Part[];
}

export function BraceletPreview({ parts }: BraceletPreviewProps) {
  if (parts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-ink-500">
        No parts in the sequence.
      </div>
    );
  }

  // Compute x-positions in mm and in px.
  let cursorMm = 0;
  const positions = parts.map((p) => {
    const x = cursorMm;
    cursorMm += p.assembly_pitch_mm;
    return { part: p, xMm: x, xPx: x * PX_PER_MM };
  });
  const totalLengthMm = cursorMm;
  const contentWidthPx = totalLengthMm * PX_PER_MM;
  const canvasWidthPx = Math.max(MIN_TRACK_PX, contentWidthPx + 96);
  const canvasHeightPx = PART_HEIGHT + RULER_HEIGHT + 32;

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-ink-50/40 p-4">
      <div
        className="relative mx-auto"
        style={{ width: canvasWidthPx, height: canvasHeightPx }}
      >
        {/* Ruler baseline */}
        <Ruler
          widthPx={canvasWidthPx}
          totalLengthMm={totalLengthMm}
          pxPerMm={PX_PER_MM}
        />

        {/* Parts, positioned by pitch */}
        {positions.map(({ part, xPx }, i) => {
          // The connector has pitch=0 — its PNG overlaps the previous part.
          // We render it with a small x-offset so the user can still see it.
          const isConnector = part.category === 'connector';
          const xOffsetPx = isConnector
            ? // Place the connector centered on the *right edge* of the
              // previous part so the visual is "stuck onto" the joint.
              Math.max(0, xPx - part.png_width_px / 2)
            : xPx;

          return (
            <div
              key={`${part.part_code}-${i}`}
              className="absolute top-4 flex flex-col items-center"
              style={{
                left: xOffsetPx,
                width: part.png_width_px,
                height: PART_HEIGHT,
              }}
              title={`${part.name} (${part.part_code}) — ${part.assembly_pitch_mm}mm`}
            >
              <img
                src={part.png_asset_url}
                alt={part.name}
                draggable={false}
                className="h-full w-full object-contain"
                style={{
                  // End caps and the very first connector shouldn't be dimmed;
                  // pitch-0 connectors get a faint outline to make the
                  // "link visible but not counted" point obvious.
                  outline: isConnector
                    ? '1px dashed rgba(91,76,32,0.5)'
                    : undefined,
                  outlineOffset: isConnector ? '-2px' : undefined,
                }}
              />
              {isConnector ? (
                <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-300">
                  ↳ 0 mm
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-ink-500">
                  {part.assembly_pitch_mm.toFixed(1)} mm
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ruler({
  widthPx,
  totalLengthMm,
  pxPerMm,
}: {
  widthPx: number;
  totalLengthMm: number;
  pxPerMm: number;
}) {
  // Show a tick every 5mm with labels every 10mm.
  const ticks: { x: number; label?: string }[] = [];
  for (let mm = 0; mm <= totalLengthMm; mm += 5) {
    ticks.push({ x: mm * pxPerMm, label: mm % 10 === 0 ? `${mm}` : undefined });
  }
  return (
    <div
      className="absolute bottom-0 left-0 right-0 border-t border-ink-100"
      style={{ height: RULER_HEIGHT }}
    >
      {ticks.map((t, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{ left: t.x, height: t.label ? 12 : 6 }}
        >
          <div className="h-full w-px bg-ink-300" />
          {t.label ? (
            <div
              className="absolute -translate-x-1/2 whitespace-nowrap pt-1
                font-mono text-[10px] text-ink-500"
            >
              {t.label} mm
            </div>
          ) : null}
        </div>
      ))}
      <div className="absolute -top-5 right-0 font-mono text-[11px] text-ink-700">
        total = {totalLengthMm.toFixed(1)} mm
      </div>
      <div
        className="absolute -top-0.5 h-0.5 bg-amber-400"
        style={{ left: 0, width: totalLengthMm * pxPerMm }}
      />
    </div>
  );
}
