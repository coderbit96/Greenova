import { cn } from "@/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brass";

const tones: Record<Tone, string> = {
  neutral: "bg-bg-subtle text-fg-muted border-border-base",
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  danger:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  brass: "bg-brass-100 text-brass-800 border-brass-200 dark:bg-brass-900/40 dark:text-brass-200 dark:border-brass-800",
};

export default function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "confirmed":
    case "CONFIRMED":
    case "paid":
    case "PAID":
      return "success";
    case "pending":
    case "PENDING":
    case "PAYMENT_PENDING":
    return "warning";
    case "cancelled":
    case "CANCELLED":
    case "failed":
    case "FAILED":
    case "NO_SHOW":
      return "danger";
    case "completed":
    case "CHECKED_IN":
    case "CHECKED_OUT":
      return "info";
    case "refunded":
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    case "REFUND_PENDING":
      return "brass";
    default:
      return "neutral";
  }
}
