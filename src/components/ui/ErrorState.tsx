import Link from "next/link";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title: string;
  body: string;
  href?: string;
  action?: string;
}

/** A safe, customer-facing fallback for expected page-level failures. */
export default function ErrorState({
  title,
  body,
  href,
  action = "Try again",
}: ErrorStateProps) {
  return (
    <section className="mt-12 rounded-3xl border border-dashed border-border-base bg-bg-elevated px-6 py-14 text-center sm:px-10">
      <AlertCircle className="mx-auto size-8 text-brass-600 dark:text-brass-300" strokeWidth={1.5} />
      <h2 className="mt-4 font-display text-2xl font-medium">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">{body}</p>
      {href ? (
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:bg-forest-500 dark:hover:bg-forest-400"
        >
          {action}
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-fg-muted">
          <RefreshCw className="size-4" /> Please refresh to try again.
        </p>
      )}
    </section>
  );
}
