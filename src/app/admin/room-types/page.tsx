import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { listAllRooms } from "@/services/room.service";
import { formatCurrency } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Room Types",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RoomTypesPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/room-types");

  const rooms = await listAllRooms();

  // Group inventory by category so the mix of the estate is visible at once.
  const byCategory = new Map<string, typeof rooms>();
  for (const room of rooms) {
    const list = byCategory.get(room.category) ?? [];
    list.push(room);
    byCategory.set(room.category, list);
  }

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Room Types</h1>
      <p className="mt-3 text-sm text-fg-muted">
        {byCategory.size} {byCategory.size === 1 ? "category" : "categories"} across{" "}
        {rooms.length} room types.
      </p>

      <div className="mt-10 space-y-10">
        {[...byCategory.entries()].map(([category, list]) => {
          const units = list.reduce((sum, r) => sum + r.totalUnits, 0);
          return (
            <section key={category}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-medium">{category}</h2>
                <p className="text-sm text-fg-muted">
                  {list.length} {list.length === 1 ? "type" : "types"} · {units} units
                </p>
              </div>

              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {list.map((room) => (
                  <li
                    key={room._id}
                    className="rounded-3xl border border-border-base bg-bg-elevated p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-medium">{room.name}</h3>
                      {room.featured && <Badge tone="brass">Signature</Badge>}
                      <Badge tone={room.active ? "success" : "neutral"}>
                        {room.active ? "Live" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-fg-muted">
                      {formatCurrency(room.pricePerNight)} / night · {room.totalUnits} units ·
                      up to {room.capacity.adults} adults
                    </p>
                    <p className="mt-1 text-xs text-fg-muted">
                      {room.bedType} bed · {room.sizeSqft} sq ft
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-10 text-sm text-fg-muted">
        Rates and inventory are edited on the{" "}
        <Link href="/admin/rooms" className="underline underline-offset-4 hover:text-fg">
          Rooms
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
