import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listActiveRooms } from "@/services/room.service";
import { findAvailableRooms } from "@/services/availability.service";
import { serialize, formatDate, todayUTC, MS_PER_DAY } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Availability",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/availability");

  const today = todayUTC();
  const tomorrow = new Date(today.getTime() + MS_PER_DAY);

  const [rooms, tonight] = await Promise.all([
    listActiveRooms(),
    findAvailableRooms({ checkIn: today, checkOut: tomorrow, adults: 1, children: 0 }),
  ]);

  const live = serialize(tonight) as unknown as {
    _id: string;
    name: string;
    unitsLeft: number;
    totalUnits: number;
  }[];

  const byId = new Map(live.map((r) => [r._id, r]));
  const totalUnits = rooms.reduce((sum, r) => sum + r.totalUnits, 0);
  const freeUnits = live.reduce((sum, r) => sum + r.unitsLeft, 0);

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">
        Availability
      </h1>
      <p className="mt-3 text-sm text-fg-muted">
        Tonight, {formatDate(today)} · {freeUnits} of {totalUnits} units free
      </p>

      <ul className="mt-8 space-y-3">
        {rooms.map((room) => {
          const state = byId.get(room._id);
          const left = state?.unitsLeft ?? room.totalUnits;
          const sold = room.totalUnits - left;
          const pct = room.totalUnits > 0 ? Math.round((sold / room.totalUnits) * 100) : 0;

          return (
            <li
              key={room._id}
              className="rounded-3xl border border-border-base bg-bg-elevated p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs tracking-wider text-fg-muted uppercase">
                    {room.category}
                  </p>
                  <h2 className="font-display text-xl font-medium">{room.name}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm tabular-nums text-fg-muted">
                    {left} of {room.totalUnits} free
                  </p>
                  {left === 0 ? (
                    <Badge tone="danger">Sold out</Badge>
                  ) : left <= 2 ? (
                    <Badge tone="warning">Low</Badge>
                  ) : (
                    <Badge tone="success">Available</Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className="h-full rounded-full bg-forest-600 dark:bg-forest-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-fg-muted">{pct}% sold tonight</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
