import type { Metadata } from "next";
import Link from "next/link";
import { MapPinOff } from "lucide-react";

export const metadata: Metadata = { title: "Page Not Found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-24">
      <section className="max-w-lg text-center">
        <MapPinOff className="mx-auto size-10 text-brass-600 dark:text-brass-300" strokeWidth={1.5} />
        <p className="mt-6 text-xs font-medium tracking-[0.25em] text-brass-600 uppercase dark:text-brass-300">404</p>
        <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl">We could not find that page</h1>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
          The room, booking, or page may no longer be available. For privacy, booking links only work for the account that made the reservation.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/rooms" className="inline-flex min-h-11 items-center rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800 dark:bg-forest-500">
            Browse rooms
          </Link>
          <Link href="/account/bookings" className="inline-flex min-h-11 items-center rounded-full border border-border-base px-5 py-2.5 text-sm font-medium transition-colors hover:bg-bg-subtle">
            My bookings
          </Link>
        </div>
      </section>
    </main>
  );
}
