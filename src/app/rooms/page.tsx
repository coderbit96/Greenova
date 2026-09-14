import type { Metadata } from "next";
import { Suspense } from "react";
import {
  listActiveRooms,
  listRoomCategories,
  type RoomSort,
} from "@/services/room.service";
import { findAvailableRooms } from "@/services/availability.service";
import { serialize, formatDate, nightsBetween, toUTCDay } from "@/utils";
import RoomCard, { type RoomCardData } from "@/components/rooms/RoomCard";
import RoomFilters from "@/components/rooms/RoomFilters";
import SearchWidget from "@/components/booking/SearchWidget";
import Reveal from "@/components/ui/Reveal";
import ErrorState from "@/components/ui/ErrorState";
import { availabilitySchema } from "@/validators/booking";

export const metadata: Metadata = {
  title: "Rooms & Suites",
  description:
    "Twenty-four suites and villas suspended in the rainforest canopy. Filter by category, price and party size, and check live availability.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  rooms?: string;
  category?: string;
  /** "0-12000", "12000-25000" or "40000-". */
  price?: string;
  guests?: string;
  sort?: string;
  availableOnly?: string;
}

const VALID_SORTS: RoomSort[] = ["recommended", "price-asc", "price-desc", "popular"];

function parsePriceBand(band?: string): { minPrice?: number; maxPrice?: number } {
  if (!band) return {};
  const [min, max] = band.split("-");
  return {
    minPrice: min ? Number(min) : undefined,
    maxPrice: max ? Number(max) : undefined,
  };
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const hasSearch = Boolean(sp.checkIn && sp.checkOut);
  const stay = hasSearch
    ? availabilitySchema.safeParse({
        checkIn: sp.checkIn,
        checkOut: sp.checkOut,
        adults: sp.adults ?? 1,
        children: sp.children ?? 0,
        rooms: sp.rooms ?? 1,
      })
    : null;
  const invalidDates = Boolean(stay && !stay.success);

  const sort = (VALID_SORTS as string[]).includes(sp.sort ?? "")
    ? (sp.sort as RoomSort)
    : "recommended";

  // Both the guests filter and the search widget's adults narrow capacity;
  // take whichever is stricter so the two controls cannot contradict.
  const guestFilter = sp.guests ? Number(sp.guests) : undefined;
  const searchAdults = sp.adults ? Number(sp.adults) : undefined;
  const adults = Math.max(guestFilter ?? 0, searchAdults ?? 0) || undefined;

  let rooms: RoomCardData[] = [];
  let categories: string[] = [];
  let loadError = false;

  try {
    const { minPrice, maxPrice } = parsePriceBand(sp.price);

    const [listed, cats] = await Promise.all([
      listActiveRooms({
        category: sp.category,
        minPrice,
        maxPrice,
        adults,
        children: sp.children ? Number(sp.children) : undefined,
        sort,
      }),
      listRoomCategories(),
    ]);

    categories = cats;
    rooms = listed as unknown as RoomCardData[];

    if (stay?.success) {
      // Annotate the filtered set with live availability, intersecting on id
      // so a room failing the capacity check drops out entirely.
      const withAvailability = serialize(
        await findAvailableRooms({
          checkIn: toUTCDay(stay.data.checkIn),
          checkOut: toUTCDay(stay.data.checkOut),
          adults: stay.data.adults,
          children: stay.data.children,
          rooms: stay.data.rooms,
        }),
      ) as unknown as RoomCardData[];

      const byId = new Map(withAvailability.map((r) => [r._id, r]));
      rooms = rooms
        .filter((r) => byId.has(r._id))
        .map((r) => {
          const live = byId.get(r._id)!;
          return { ...r, unitsLeft: live.unitsLeft, available: live.available };
        });

      if (sp.availableOnly === "1") {
        rooms = rooms.filter((r) => r.available !== false);
      }
    }
  } catch (err) {
    console.error("[rooms] load failed:", err);
    loadError = true;
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

  const nights = stay?.success ? nightsBetween(stay.data.checkIn, stay.data.checkOut) : 0;
  const availableCount = rooms.filter((r) => r.available !== false).length;

  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Accommodation
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Rooms &amp; Suites
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            Every room faces the valley. Rates include breakfast, the spa circuit and a
            guided walk each morning.
          </p>
        </Reveal>

        <div className="mt-12">
          <SearchWidget compact />
        </div>

        <div className="mt-4">
          {/* useSearchParams needs a Suspense boundary during prerender. */}
          <Suspense
            fallback={
              <div className="h-44 animate-pulse rounded-3xl border border-border-base bg-bg-subtle" />
            }
          >
            <RoomFilters categories={categories} resultCount={rooms.length} />
          </Suspense>
        </div>

        {stay?.success && !loadError && (
          <div className="mt-6 rounded-2xl border border-border-base bg-bg-subtle px-5 py-4 text-sm">
            <p className="text-fg">
              <span className="font-medium">{availableCount}</span>{" "}
              {availableCount === 1 ? "room" : "rooms"} available for{" "}
              <span className="font-medium">{nights}</span> {nights === 1 ? "night" : "nights"}
              {" · "}
              {formatDate(sp.checkIn!)} — {formatDate(sp.checkOut!)}
            </p>
          </div>
        )}

        {invalidDates ? (
          <ErrorState
            title="Choose valid stay dates"
            body="Select a check-in date from today onward and a later check-out date."
            href="/rooms"
            action="Browse all rooms"
          />
        ) : loadError ? (
          <ErrorState
            title="We could not load rooms"
            body="We could not load rooms right now. Please try again in a moment."
            href={query ? `/rooms?${query}` : "/rooms"}
          />
        ) : rooms.length === 0 ? (
          <EmptyState
            title="No rooms match those filters"
            body="Try widening the price range or clearing a filter. If the hotel is empty, run `npm run seed` to add its suites."
          />
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <RoomCard key={room._id} room={room} query={query} index={i} />
            ))}
          </div>
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
