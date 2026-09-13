"use client";

import { Check, CircleDot, Loader2 } from "lucide-react";
import { cn } from "@/utils";
import type { CheckoutStep } from "@/hooks/useCheckout";

type View = "details" | "review";

const stages = [
  { label: "Guest details", number: 7 },
  { label: "Review", number: 8 },
  { label: "Payment", number: 9 },
  { label: "Verify", number: 10 },
  { label: "Confirmed", number: 11 },
] as const;

function activeStage(view: View, step: CheckoutStep) {
  if (step === "creating" || step === "paying") return 2;
  if (step === "verifying") return 3;
  if (step === "done") return 4;
  return view === "review" ? 1 : 0;
}

/** A compact, truthful progress indicator for the final checkout stages. */
export default function BookingWorkflow({ view, step }: { view: View; step: CheckoutStep }) {
  const active = activeStage(view, step);

  return (
    <ol className="mb-10 grid gap-3 sm:grid-cols-5" aria-label="Booking progress">
      {stages.map((stage, index) => {
        const complete = index < active || step === "done";
        const current = index === active && step !== "done";
        return (
          <li
            key={stage.number}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
              current && "border-forest-500 bg-forest-50 text-forest-800 dark:bg-forest-900/40 dark:text-forest-200",
              complete && !current && "border-forest-200 bg-forest-50/60 text-forest-700 dark:border-forest-800 dark:bg-forest-900/20 dark:text-forest-300",
              !current && !complete && "border-border-base text-fg-muted",
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-current">
              {current && (step === "creating" || step === "paying" || step === "verifying") ? (
                <Loader2 className="size-3 animate-spin" />
              ) : complete ? (
                <Check className="size-3" />
              ) : current ? (
                <CircleDot className="size-3" />
              ) : (
                stage.number
              )}
            </span>
            <span>{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
