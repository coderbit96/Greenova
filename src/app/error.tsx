"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * The nearest error boundary for route rendering. It deliberately never
 * renders `error.message` or a stack trace: those can disclose infrastructure
 * details to guests.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep diagnostics available to developers without placing them in the UI.
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-24">
      <section className="max-w-lg text-center">
        <AlertTriangle className="mx-auto size-10 text-brass-600 dark:text-brass-300" strokeWidth={1.5} />
        <p className="mt-6 text-xs font-medium tracking-[0.25em] text-brass-600 uppercase dark:text-brass-300">
          Greenova
        </p>
        <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl">Something went wrong</h1>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
          We could not complete that request. Before trying payment again, check My Bookings for the latest reservation status.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:bg-forest-500 dark:hover:bg-forest-400"
          >
            <RefreshCw className="size-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-border-base px-5 py-2.5 text-sm font-medium transition-colors hover:bg-bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
