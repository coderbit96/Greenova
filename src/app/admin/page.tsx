import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  IndianRupee,
  CalendarPlus,
  LogIn,
  LogOut,
  CalendarCheck,
  BedDouble,
  DoorOpen,
  Percent,
  Wallet,
  XCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getAdminOverview } from "@/services/stats.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";
import TrendChart from "@/components/admin/TrendChart";
import BreakdownChart from "@/components/admin/BreakdownChart";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const {
    metrics,
    revenueTrend,
    bookingTrend,
    occupancyTrend,
    roomPopularity,
    paymentStatus,
    bookingStatus,
    bookingSource,
    recentBookings,
  } = await getAdminOverview();

  const today = [
    {
      label: "Bookings today",
      value: String(metrics.bookingsToday),
      hint: "Reservations made today",
      Icon: CalendarPlus,
    },
    {
      label: "Check-ins today",
      value: String(metrics.checkInsToday),
      hint: "Arrivals expected",
      Icon: LogIn,
    },
    {
      label: "Check-outs today",
      value: String(metrics.checkOutsToday),
      hint: "Departures expected",
      Icon: LogOut,
    },
    {
      label: "Revenue today",
      value: formatCurrency(metrics.revenueToday),
      hint: "Payments cleared today",
      Icon: IndianRupee,
    },
  ];

  const estate = [
    {
      label: "Occupied rooms",
      value: String(metrics.occupiedRooms),
      hint: "In house tonight",
      Icon: DoorOpen,
    },
    {
      label: "Available rooms",
      value: String(metrics.availableRooms),
      hint: "Sellable tonight",
      Icon: BedDouble,
    },
    {
      label: "Occupancy",
      value: `${metrics.occupancyPercent}%`,
      hint: "Of sellable units",
      Icon: Percent,
    },
    {
      label: "Confirmed bookings",
      value: String(metrics.confirmedBookings),
      hint: "All time",
      Icon: CalendarCheck,
    },
  ];

  const money = [
    {
      label: "Revenue, 30 days",
      value: formatCurrency(metrics.revenueMonth),
      hint: "Payments cleared",
      Icon: TrendingUp,
    },
    {
      label: "Pending payments",
      value: String(metrics.pendingPayments),
      hint: `${formatCurrency(metrics.pendingPaymentsValue)} outstanding`,
      Icon: Wallet,
    },
    {
      label: "Cancellations",
      value: String(metrics.cancellations),
      hint: "All time",
      Icon: XCircle,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            {formatDate(new Date(), {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900 dark:text-forest-400 dark:hover:text-forest-200"
        >
          All bookings
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <Section title="Today">
        <MetricGrid cards={today} />
      </Section>

      <Section title="The estate">
        <MetricGrid cards={estate} />
      </Section>

      <Section title="Money">
        <MetricGrid cards={money} />
      </Section>

      {/* Charts */}
      <div className="mt-10 grid gap-5 xl:grid-cols-2">
        <Panel title="Revenue trend" subtitle="Payments cleared, last 30 days">
          <TrendChart
            data={revenueTrend}
            format="currency"
            emptyLabel="No payments cleared in the last 30 days."
          />
        </Panel>

        <Panel title="Booking trend" subtitle="Reservations made, last 30 days">
          <TrendChart
            data={bookingTrend}
            format="count"
            emptyLabel="No bookings made in the last 30 days."
          />
        </Panel>

        <Panel title="Occupancy trend" subtitle="Share of sellable units, last 30 days">
          <TrendChart
            data={occupancyTrend}
            format="percent"
            emptyLabel="No occupied nights in the last 30 days."
          />
        </Panel>

        <Panel title="Room popularity" subtitle="Units sold, excluding cancellations">
          <BreakdownChart
            data={roomPopularity}
            format="units"
            emptyLabel="No rooms sold yet."
          />
        </Panel>

        <Panel title="Payment status" subtitle="Every booking by payment state">
          <BreakdownChart data={paymentStatus} tone="status" />
        </Panel>

        <Panel title="Booking status" subtitle="Every booking by lifecycle state">
          <BreakdownChart data={bookingStatus} tone="status" />
        </Panel>

        <Panel title="Booking source" subtitle="Online versus administrator-entered stays">
          <BreakdownChart data={bookingSource} />
        </Panel>
      </div>

      {/* Recent bookings */}
      <section className="mt-10 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
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
            No bookings yet.
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
                {recentBookings.map((row) => (
                  <tr key={row._id} className="transition-colors hover:bg-bg-subtle">
                    <td className="px-6 py-4 font-medium sm:px-8">{row.reference}</td>
                    <td className="px-6 py-4">
                      <p className="text-fg">{row.guest.name}</p>
                      <p className="truncate text-xs text-fg-muted">{row.guest.email}</p>
                    </td>
                    <td className="hidden px-6 py-4 text-fg-muted md:table-cell">
                      {typeof row.room === "object" && row.room ? row.room.name : "—"}
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-fg-muted lg:table-cell">
                      {formatDate(row.checkIn)} — {formatDate(row.checkOut)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium whitespace-nowrap sm:px-8">
                      {formatCurrency(row.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-medium tracking-widest text-fg-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface MetricCard {
  label: string;
  value: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function MetricGrid({ cards }: { cards: MetricCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-7">
      <div>
        <h2 className="font-display text-xl font-medium">{title}</h2>
        <p className="text-xs text-fg-muted">{subtitle}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
