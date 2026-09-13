"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils";

interface Point {
  _id: string; // yyyy-mm-dd
  revenue: number; // paise
}

/**
 * Single-series area + line chart of daily revenue.
 *
 * Series colour is validated against both chart surfaces (six-check
 * validator): #0e8f5f on light, #25a973 on dark. One series, so no legend
 * box — the section heading names it. Hover gives a crosshair and tooltip.
 */
export default function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);

  // Fill missing days so the x-axis is continuous rather than skipping gaps.
  const series = useMemo(() => {
    const byDay = new Map(data.map((d) => [d._id, d.revenue]));
    const out: Point[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      out.push({ _id: key, revenue: byDay.get(key) ?? 0 });
    }
    return out;
  }, [data]);

  const max = Math.max(...series.map((p) => p.revenue), 1);
  const total = series.reduce((sum, p) => sum + p.revenue, 0);

  const W = 720;
  const H = 200;
  const PAD_X = 8;
  const PAD_Y = 16;

  const stepX = (W - PAD_X * 2) / Math.max(series.length - 1, 1);
  const x = (i: number) => PAD_X + i * stepX;
  const y = (v: number) => H - PAD_Y - (v / max) * (H - PAD_Y * 2);

  const linePath = series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.revenue)}`).join(" ");
  const areaPath = `${linePath} L${x(series.length - 1)},${H - PAD_Y} L${x(0)},${H - PAD_Y} Z`;

  if (total === 0) {
    return (
      <div className="grid h-48 place-items-center rounded-2xl bg-bg-subtle">
        <p className="text-sm text-fg-muted">No paid bookings in the last 30 days yet.</p>
      </div>
    );
  }

  const active = hover !== null ? series[hover] : null;

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 200 }}
          role="img"
          aria-label={`Daily revenue for the last 30 days, totalling ${formatCurrency(total)}`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-series)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-series)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Recessive gridlines */}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y(max * t)}
              y2={y(max * t)}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray={t === 0 ? undefined : "3 4"}
            />
          ))}

          <path d={areaPath} fill="url(#revfill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--chart-series)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Crosshair + marker */}
          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD_Y}
                y2={H - PAD_Y}
                stroke="var(--fg-muted)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hover)}
                cy={y(series[hover].revenue)}
                r="5"
                fill="var(--chart-series)"
                stroke="var(--bg-elevated)"
                strokeWidth="2"
              />
            </>
          )}

          {/* Invisible hit targets, wider than the marks */}
          {series.map((p, i) => (
            <rect
              key={p._id}
              x={x(i) - stepX / 2}
              y={0}
              width={stepX}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {active && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-xl border border-border-base bg-bg-elevated px-3 py-2 text-xs shadow-lg"
            style={{ left: `${(x(hover!) / W) * 100}%` }}
          >
            <p className="font-medium text-fg">{formatCurrency(active.revenue)}</p>
            <p className="text-fg-muted">
              {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
                new Date(active._id),
              )}
            </p>
          </div>
        )}
      </div>

      <figcaption className="mt-3 flex justify-between text-xs text-fg-muted">
        <span>
          {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
            new Date(series[0]._id),
          )}
        </span>
        <span className="font-medium text-fg">{formatCurrency(total)} total</span>
        <span>Today</span>
      </figcaption>

      {/* Series colour, validated per surface. */}
      <style>{`
        figure { --chart-series: #0e8f5f; }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) figure { --chart-series: #25a973; }
        }
        :root[data-theme="dark"] figure { --chart-series: #25a973; }
      `}</style>
    </figure>
  );
}
