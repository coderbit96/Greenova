import type { Metadata } from "next";
import Link from "next/link";
import {
  IndianRupee,
  CalendarCheck,
  Users,
  BedDouble,
  TrendingUp,
  LogIn,
  Home,
  ArrowRight,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/services/stats.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";
import RevenueChart from "@/components/admin/RevenueChart";

export const metadata: Metadata = {
  title: "Admin Overview",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";


export default async function AdminOverview() {
  // Re-checked here, not just in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/");

  const { stats, recentBookings, revenueByDay } = await getDashboardData();

  const cards = [
    {
      label: "Total revenue",
      value: formatCurrency(stats.totalRevenue),
      hint: `${formatCurrency(stats.monthRevenue)} in the last 30 days`,
      Icon: IndianRupee,
    },
    {
      label: "Bookings",
      value: String(stats.totalBookings),
      hint: stats.pendingBookings > 0 ? `${stats.pendingBookings} awaiting payment` : "All settled",
      Icon: CalendarCheck,
    },
    { label: "Arrivals today", value: String(stats.arrivalsToday), hint: `${stats.inHouse} in house`, Icon: LogIn },
    { label: "Guests", value: String(stats.totalCustomers), hint: `${stats.activeRooms} rooms live`, Icon: Users },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Overview</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {formatDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, Icon }) => (
          <div key={label} className="rounded-3xl border border-border-base bg-bg-elevated p-6">
            <div className="flex items-start justify-between">
              <p className="text-xs tracking-wider text-fg-muted uppercase">{label}</p>
              <Icon className="size-4 text-forest-500" />
            </div>
            <p className="mt-3 font-display text-3xl font-light">{value}</p>
            <p className="mt-1 text-xs text-fg-muted">{hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium">Revenue</h2>
            <p className="text-xs text-fg-muted">Paid bookings, last 30 days</p>
          </div>
          <TrendingUp className="size-5 text-forest-500" />
        </div>
        <div className="mt-6">
          <RevenueChart data={revenueByDay} />
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
        <div className="flex items-center justify-between p-6 sm:px-8">
          <h2 className="font-display text-2xl font-medium">Recent bookings</h2>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:underline dark:text-forest-400"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="border-t border-border-base px-6 py-12 text-center text-sm text-fg-muted sm:px-8">
            No bookings yet. Run <code className="rounded bg-bg-subtle px-1.5 py-0.5">npm run seed</code>{" "}
            to add demo data.
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-border-base">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium sm:px-8">Reference</th>
                  <th className="px-6 py-3 font-medium">Guest</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Room</th>
                  <th className="hidden px-6 py-3 font-medium lg:table-cell">Dates</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium sm:px-8">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {recentBookings.map((row) => {
                  return (
                    <tr key={row._id} className="transition-colors hover:bg-bg-subtle">
                      <td className="px-6 py-4 font-medium sm:px-8">{row.reference}</td>
                      <td className="px-6 py-4">
                        <p className="text-fg">{row.guest.name}</p>
                        <p className="truncate text-xs text-fg-muted">{row.guest.email}</p>
                      </td>
                      <td className="hidden px-6 py-4 text-fg-muted md:table-cell">
                        {typeof row.room === "object" && row.room ? row.room.name : "—"}
                      </td>
                      <td className="hidden px-6 py-4 text-fg-muted lg:table-cell">
                        {formatDate(row.checkIn)} — {formatDate(row.checkOut)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium sm:px-8">
                        {formatCurrency(row.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/rooms"
          className="group flex items-center justify-between rounded-3xl border border-border-base bg-bg-elevated p-6 transition-all hover:border-forest-300 hover:shadow-lg dark:hover:border-forest-700"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-900/60 dark:text-forest-300">
              <BedDouble className="size-5" />
            </span>
            <div>
              <p className="font-medium">Manage rooms</p>
              <p className="text-xs text-fg-muted">Rates, inventory and photography</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-fg-muted transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/bookings"
          className="group flex items-center justify-between rounded-3xl border border-border-base bg-bg-elevated p-6 transition-all hover:border-forest-300 hover:shadow-lg dark:hover:border-forest-700"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-900/60 dark:text-forest-300">
              <Home className="size-5" />
            </span>
            <div>
              <p className="font-medium">Manage bookings</p>
              <p className="text-xs text-fg-muted">Confirm, cancel and refund</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-fg-muted transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  );
}
