import type { Metadata } from "next";
import Link from "next/link";
import { CalendarSearch, ShieldCheck, Sparkles } from "lucide-react";
import { findAvailableRooms } from "@/services/availability.service";
import { serialize, formatDate, nightsBetween } from "@/utils";
import RoomCard, { type RoomCardData } from "@/components/rooms/RoomCard";
import SearchWidget from "@/components/booking/SearchWidget";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Availability",
  description:
    "Check live room availability at Greenova for your dates. No account needed to search.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  rooms?: string;
}

/**
 * Dedicated availability search. Browsing and searching need no account —
 * only the reservation itself requires signing in.
 */
export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const hasSearch = Boolean(sp.checkIn && sp.checkOut);

  let rooms: RoomCardData[] = [];
  let loadError = false;

  if (hasSearch) {
    try {
      const result = await findAvailableRooms({
        checkIn: new Date(sp.checkIn!),
        checkOut: new Date(sp.checkOut!),
        adults: Number(sp.adults ?? 1),
        children: Number(sp.children ?? 0),
        rooms: Number(sp.rooms ?? 1),
      });
      rooms = serialize(result) as unknown as RoomCardData[];
    } catch (err) {
      console.error("[availability] search failed:", err);
      loadError = true;
    }
  }

  const query = hasSearch
    ? new URLSearchParams({
        checkIn: sp.checkIn!,
        checkOut: sp.checkOut!,
        adults: String(sp.adults ?? 1),
        children: String(sp.children ?? 0),
        rooms: String(sp.rooms ?? 1),
      }).toString()
    : undefined;

  const nights = hasSearch ? nightsBetween(sp.checkIn!, sp.checkOut!) : 0;
  const available = rooms.filter((r) => r.available !== false);
  const soldOut = rooms.filter((r) => r.available === false);

  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Reservations
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Check availability
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            Live inventory, updated the moment a room is taken. Searching needs no
            account — you only sign in to confirm a reservation.
          </p>
        </Reveal>

        <div className="mt-12">
          <SearchWidget compact />
        </div>

        {!hasSearch ? (
          /* Nothing searched yet — explain what happens next. */
          <div className="mt-16">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  Icon: CalendarSearch,
                  title: "Pick your dates",
                  body: "We show every room that is genuinely free, with how many of each are left.",
                },
                {
                  Icon: Sparkles,
                  title: "Rates include everything",
                  body: "Breakfast, the spa circuit and the morning walk. No resort fee, ever.",
                },
                {
                  Icon: ShieldCheck,
                  title: "Cancel free",
                  body: "Up to 48 hours before you arrive, refunded in full to your card.",
                },
              ].map(({ Icon, title, body }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="h-full rounded-3xl border border-border-base bg-bg-elevated p-8">
                    <span className="mb-5 inline-grid size-11 place-items-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-900/60 dark:text-forest-300">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <h2 className="font-display text-xl font-medium">{title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-12 text-center text-sm text-fg-muted">
              Prefer to browse first?{" "}
              <Link href="/rooms" className="underline underline-offset-4 hover:text-fg">
                See all rooms and suites
              </Link>
              .
            </p>
          </div>
        ) : loadError ? (
          <EmptyState
            title="We could not check availability"
            body="The database is unreachable. Check that MONGODB_URI is set and MongoDB is running, then try again."
          />
        ) : (
          <>
            <div className="mt-8 rounded-2xl border border-border-base bg-bg-subtle px-5 py-4 text-sm">
              <p className="text-fg">
                <span className="font-medium">{available.length}</span>{" "}
                {available.length === 1 ? "room" : "rooms"} available for{" "}
                <span className="font-medium">{nights}</span>{" "}
                {nights === 1 ? "night" : "nights"}
                {" · "}
                {formatDate(sp.checkIn!)} — {formatDate(sp.checkOut!)}
                {soldOut.length > 0 && (
                  <span className="text-fg-muted">
                    {" · "}
                    {soldOut.length} sold out
                  </span>
                )}
              </p>
            </div>

            {rooms.length === 0 ? (
              <EmptyState
                title="Nothing free for those dates"
                body="Every room is taken, or none fits that party size. Try shifting your stay by a night or two — the estate turns over most Sundays."
              />
            ) : (
              <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...available, ...soldOut].map((room, i) => (
                  <RoomCard key={room._id} room={room} query={query} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-16 rounded-3xl border border-dashed border-border-base py-20 text-center">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
