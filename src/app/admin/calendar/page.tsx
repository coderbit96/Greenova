import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBookingCalendar, getOccupancyCalendar } from "@/services/stats.service";
import { formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/calendar");

  const [{ days, totalUnits }, bookings] = await Promise.all([getOccupancyCalendar(28), getBookingCalendar(28)]);

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Calendar</h1>
      <p className="mt-3 text-sm text-fg-muted">
        Occupancy for the next 28 nights, against {totalUnits} sellable units.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const pct = totalUnits > 0 ? Math.round((day.occupied / totalUnits) * 100) : 0;
          const tone =
            pct >= 90
              ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
              : pct >= 60
                ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                : pct > 0
                  ? "border-forest-300 bg-forest-50 dark:border-forest-800 dark:bg-forest-950/40"
                  : "border-border-base bg-bg-elevated";

          return (
            <div key={day.date} className={`rounded-2xl border p-4 ${tone}`}>
              <p className="text-xs text-fg-muted">
                {formatDate(day.date, { weekday: "short" })}
              </p>
              <p className="font-display text-lg font-medium">
                {formatDate(day.date, { day: "numeric", month: "short" })}
              </p>
              <p className="mt-2 text-sm tabular-nums text-fg">
                {day.occupied}/{totalUnits}
              </p>
              <p className="text-xs text-fg-muted">{pct}% full</p>
              {day.arrivals > 0 && (
                <p className="mt-1 text-xs text-forest-700 dark:text-forest-300">
                  {day.arrivals} arriving
                </p>
              )}
            </div>
          );
        })}
      </div>

      <section className="mt-10 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
        <div className="p-6 sm:px-8"><h2 className="font-display text-2xl font-medium">Room booking timeline</h2><p className="mt-1 text-sm text-fg-muted">Reservations overlapping the next 28 nights, including cancellations and no-shows.</p></div>
        {bookings.length === 0 ? <p className="border-t border-border-base px-6 py-12 text-center text-sm text-fg-muted">No bookings in this period.</p> : <div className="overflow-x-auto border-t border-border-base"><table className="w-full text-sm"><thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase"><tr><th className="px-6 py-3 font-medium">Dates</th><th className="px-6 py-3 font-medium">Room</th><th className="px-6 py-3 font-medium">Guest</th><th className="px-6 py-3 font-medium">Units</th><th className="px-6 py-3 font-medium">State</th></tr></thead><tbody className="divide-y divide-border-base">{bookings.map((booking) => <tr key={booking._id}><td className="px-6 py-4 whitespace-nowrap text-fg-muted">{formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}</td><td className="px-6 py-4"><p className="font-medium">{booking.room?.name ?? "Archived room"}</p><p className="text-xs text-fg-muted">{booking.room?.category ?? booking.roomType}</p></td><td className="px-6 py-4">{booking.guest.name}</td><td className="px-6 py-4">{booking.roomsBooked}</td><td className="px-6 py-4"><Badge tone={statusTone(booking.status)}>{booking.bookingStatus.replaceAll("_", " ")}</Badge></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
