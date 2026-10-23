import { useState } from "react";

export interface Point {
  date: string;
  value: number;
  label?: string;
}

const W = 340;
const H = 170;
const PAD = { top: 16, right: 14, bottom: 26, left: 40 };

const short = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Single-series line chart with tap/hover tooltips. Time is spaced by date, not by entry. */
export function LineChart({ points, unit, title }: { points: Point[]; unit: string; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return null;

  const times = points.map((p) => new Date(p.date + "T00:00:00").getTime());
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const values = points.map((p) => p.value);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.05);
  lo = Math.max(0, lo - pad);
  hi = hi + pad;

  const x = (t: number) => PAD.left + (t1 === t0 ? (W - PAD.left - PAD.right) / 2 : ((t - t0) / (t1 - t0)) * (W - PAD.left - PAD.right));
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const a = active != null ? points[active] : null;

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(times[i]) - px) < Math.abs(x(times[best]) - px)) best = i;
    setActive(best);
  };

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}: ${points.length} entries, latest ${points.at(-1)!.value} ${unit}`}
        onPointerMove={(e) => nearest(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => nearest(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={PAD.left - 6} y={y(t) + 4} className="chart__tick" textAnchor="end">
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} className="chart__tick">
          {short(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} className="chart__tick" textAnchor="end">
            {short(points.at(-1)!.date)}
          </text>
        )}
        <path d={path} className="chart__line" />
        {points.map((p, i) => (
          <circle key={p.date + i} cx={x(times[i])} cy={y(p.value)} r={i === active ? 6 : 4} className="chart__dot" />
        ))}
        {a && active != null && (
          <line x1={x(times[active])} x2={x(times[active])} y1={PAD.top} y2={H - PAD.bottom} className="chart__cross" />
        )}
      </svg>
      <figcaption className="chart__tip" aria-live="polite">
        {a ? (
          <>
            <strong>
              {a.value} {unit}
            </strong>{" "}
            {a.label ? `(${a.label}) ` : ""}· {short(a.date)}
          </>
        ) : (
          <span className="muted">Tap the chart to see a value</span>
        )}
      </figcaption>
    </figure>
  );
}
