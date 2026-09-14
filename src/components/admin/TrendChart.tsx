"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/utils";

export interface TrendPoint {
  date: string;
  value: number;
}

/**
 * Single-series area + line chart over a date window.
 *
 * Series colour is validated against both chart surfaces (#0e8f5f light,
 * #25a973 dark), matching RevenueChart. One series, so no legend box — the
 * section heading names it. Hover gives a crosshair and tooltip.
 */
export type TrendFormat = "currency" | "count" | "percent";

/**
 * Formatting is selected by name rather than by a callback: functions cannot
 * cross the server/client boundary, and these charts are rendered from server
 * components.
 */
function render(value: number, as: TrendFormat): string {
  if (as === "currency") return formatCurrency(value);
  if (as === "percent") return `${value}%`;
  return `${value} ${value === 1 ? "booking" : "bookings"}`;
}

export default function TrendChart({
  data,
  format = "count",
  emptyLabel = "No activity in this period yet.",
}: {
  data: TrendPoint[];
  format?: TrendFormat;
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const total = data.reduce((sum, p) => sum + p.value, 0);
  const max = Math.max(...data.map((p) => p.value), 1);

  const W = 720;
  const H = 180;
  const PAD_X = 8;
  const PAD_Y = 14;

  const stepX = (W - PAD_X * 2) / Math.max(data.length - 1, 1);
  const x = (i: number) => PAD_X + i * stepX;
  const y = (v: number) => H - PAD_Y - (v / max) * (H - PAD_Y * 2);

  if (data.length === 0 || total === 0) {
    return (
      <div className="grid h-44 place-items-center rounded-2xl bg-bg-subtle">
        <p className="text-sm text-fg-muted">{emptyLabel}</p>
      </div>
    );
  }

  const line = data.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - PAD_Y} L${x(0)},${H - PAD_Y} Z`;
  const active = hover !== null ? data[hover] : null;

  const day = (iso: string) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
      new Date(iso),
    );

  return (
    <figure className="trend-chart m-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 180 }}
          role="img"
          aria-label={`Trend over ${data.length} days, totalling ${render(total, format)}`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-series)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-series)" stopOpacity="0" />
            </linearGradient>
          </defs>

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

          <path d={area} fill="url(#trendfill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--chart-series)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

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
                cy={y(data[hover].value)}
                r="5"
                fill="var(--chart-series)"
                stroke="var(--bg-elevated)"
                strokeWidth="2"
              />
            </>
          )}

          {/* Hit targets wider than the marks. */}
          {data.map((p, i) => (
            <rect
              key={p.date}
              x={x(i) - stepX / 2}
              y={0}
              width={stepX}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {active && (
          <div
            className={cn(
              "pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-xl",
              "border border-border-base bg-bg-elevated px-3 py-2 text-xs shadow-lg",
            )}
            style={{ left: `${(x(hover!) / W) * 100}%` }}
          >
            <p className="font-medium text-fg">{render(active.value, format)}</p>
            <p className="text-fg-muted">{day(active.date)}</p>
          </div>
        )}
      </div>

      <figcaption className="mt-3 flex justify-between text-xs text-fg-muted">
        <span>{day(data[0].date)}</span>
        <span className="font-medium text-fg">{render(total, format)} total</span>
        <span>Today</span>
      </figcaption>

      <style>{`
        .trend-chart { --chart-series: #0e8f5f; }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .trend-chart { --chart-series: #25a973; }
        }
        :root[data-theme="dark"] .trend-chart { --chart-series: #25a973; }
      `}</style>
    </figure>
  );
}
