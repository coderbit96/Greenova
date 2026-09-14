"use client";

import { cn } from "@/utils";

export interface LabelledCount {
  label: string;
  value: number;
}

/**
 * Horizontal bars for a categorical breakdown.
 *
 * Bars are the right form here: the labels are words of varying length, and
 * horizontal rules keep them readable without rotation. Every bar is directly
 * labelled with its value, so no legend or axis is needed.
 *
 * `tone` maps a status label to a colour where the categories carry meaning
 * (paid/pending/failed); otherwise a single hue is used, since colour would
 * be decorative rather than informative.
 */
export type BreakdownFormat = "plain" | "units";

/** Selected by name: functions cannot cross the server/client boundary. */
function render(value: number, as: BreakdownFormat): string {
  return as === "units" ? `${value} ${value === 1 ? "unit" : "units"}` : String(value);
}

export default function BreakdownChart({
  data,
  tone = "single",
  format = "plain",
  emptyLabel = "Nothing to show yet.",
}: {
  data: LabelledCount[];
  tone?: "single" | "status";
  format?: BreakdownFormat;
  emptyLabel?: string;
}) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);

  if (rows.length === 0) {
    return (
      <div className="grid h-44 place-items-center rounded-2xl bg-bg-subtle">
        <p className="text-sm text-fg-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="breakdown-chart">
      <ul className="space-y-3">
        {rows.map((row) => {
          const pct = Math.round((row.value / total) * 100);
          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-fg">{row.label}</span>
                <span className="shrink-0 tabular-nums text-fg-muted">
                  {render(row.value, format)}
                  <span className="ml-2 text-xs">{pct}%</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-subtle"
                role="img"
                aria-label={`${row.label}: ${render(row.value, format)}, ${pct} percent`}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    tone === "status" ? statusColour(row.label) : "bg-[var(--chart-series)]",
                  )}
                  style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <style>{`
        .breakdown-chart { --chart-series: #0e8f5f; }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .breakdown-chart { --chart-series: #25a973; }
        }
        :root[data-theme="dark"] .breakdown-chart { --chart-series: #25a973; }
      `}</style>
    </div>
  );
}

/** Reserved status colours: good / waiting / failed / refunded. */
function statusColour(label: string): string {
  switch (label.toLowerCase()) {
    case "paid":
    case "confirmed":
    case "completed":
      return "bg-emerald-600 dark:bg-emerald-500";
    case "pending":
      return "bg-amber-500";
    case "failed":
      return "bg-red-600 dark:bg-red-500";
    case "refunded":
      return "bg-brass-500";
    case "cancelled":
      return "bg-sand-500";
    default:
      return "bg-[var(--chart-series)]";
  }
}
