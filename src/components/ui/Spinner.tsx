import { cn } from "@/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "size-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-600 dark:border-forest-900 dark:border-t-forest-400",
        className,
      )}
    />
  );
}
