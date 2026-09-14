import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminOverview } from "@/services/stats.service";
import { formatCurrency } from "@/utils";
import TrendChart from "@/components/admin/TrendChart";
import BreakdownChart from "@/components/admin/BreakdownChart";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/reports");

  const { metrics, revenueTrend, bookingTrend, occupancyTrend, roomPopularity } =
    await getAdminOverview(90);

  const averageOccupancy = occupancyTrend.length
    ? Math.round(occupancyTrend.reduce((s, p) => s + p.value, 0) / occupancyTrend.length)
    : 0;
  const totalRevenue = revenueTrend.reduce((s, p) => s + p.value, 0);
  const totalBookings = bookingTrend.reduce((s, p) => s + p.value, 0);
  const averageBooking = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const summary = [
    { label: "Revenue, 90 days", value: formatCurrency(totalRevenue) },
    { label: "Bookings, 90 days", value: String(totalBookings) },
    { label: "Average booking value", value: formatCurrency(averageBooking) },
    { label: "Average occupancy", value: `${averageOccupancy}%` },
    { label: "Confirmed", value: String(metrics.confirmedBookings) },
    { label: "Cancellations", value: String(metrics.cancellations) },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Reports</h1>
      <p className="mt-3 text-sm text-fg-muted">
        Ninety days of trading, from live booking records.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-3xl border border-border-base bg-bg-elevated p-6">
            <p className="text-xs tracking-wider text-fg-muted uppercase">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-light">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-7">
          <h2 className="font-display text-xl font-medium">Revenue</h2>
          <p className="text-xs text-fg-muted">Payments cleared, last 90 days</p>
          <div className="mt-5">
            <TrendChart data={revenueTrend} format="currency" />
          </div>
        </section>

        <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-7">
          <h2 className="font-display text-xl font-medium">Bookings</h2>
          <p className="text-xs text-fg-muted">Reservations made, last 90 days</p>
          <div className="mt-5">
            <TrendChart
              data={bookingTrend}
              format="count"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-7">
          <h2 className="font-display text-xl font-medium">Occupancy</h2>
          <p className="text-xs text-fg-muted">Share of sellable units, last 90 days</p>
          <div className="mt-5">
            <TrendChart data={occupancyTrend} format="percent" />
          </div>
        </section>

        <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-7">
          <h2 className="font-display text-xl font-medium">Room popularity</h2>
          <p className="text-xs text-fg-muted">Units sold, excluding cancellations</p>
          <div className="mt-5">
            <BreakdownChart
              data={roomPopularity}
              format="units"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
