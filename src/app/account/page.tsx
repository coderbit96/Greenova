import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, ReceiptText, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerAccountDashboard } from "@/services/stats.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const dashboard = await getCustomerAccountDashboard(session.user.id);
  if (!dashboard.user) redirect("/login?callbackUrl=/account");

  const { user, upcomingBooking, recentActivity } = dashboard;
  const stats = [
    { label: "Total bookings", value: dashboard.totalBookings, icon: ReceiptText },
    { label: "Completed stays", value: dashboard.completedStays, icon: CheckCircle2 },
    { label: "Cancelled bookings", value: dashboard.cancelledBookings, icon: XCircle },
  ];

  return (
    <div>
      <p className="text-xs tracking-widest text-fg-muted uppercase">Customer account</p>
      <h1 className="mt-2 font-display text-4xl leading-tight font-light sm:text-5xl">
        Welcome back, {user.name.split(" ")[0]}
      </h1>

      <section className="mt-8 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-5">
            {user.image ? (
              <Image src={user.image} alt="" width={80} height={80} className="size-20 rounded-full object-cover" />
            ) : (
              <span className="grid size-20 shrink-0 place-items-center rounded-full bg-forest-600 font-display text-3xl font-medium text-white">
                {user.name[0]?.toUpperCase() ?? "G"}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-display text-3xl font-medium">{user.name}</h2>
              <p className="mt-1 truncate text-sm text-fg-muted">{user.email}</p>
              <p className="mt-1 text-sm text-fg-muted">{user.phone || "No phone number added"}</p>
            </div>
          </div>
          <Link href="#profile-details" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-forest-700 hover:underline dark:text-forest-400">
            Edit profile <ArrowRight className="size-4" />
          </Link>
        </div>
        <dl className="grid border-t border-border-base sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 border-border-base px-6 py-5 sm:border-r sm:px-8 last:sm:border-r-0">
              <span className="grid size-9 place-items-center rounded-full bg-forest-50 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300"><Icon className="size-4" /></span>
              <div>
                <dt className="text-xs tracking-wide text-fg-muted uppercase">{label}</dt>
                <dd className="mt-0.5 font-display text-2xl font-medium">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-fg-muted uppercase">Next escape</p>
            <h2 className="mt-1 font-display text-3xl font-medium">Upcoming booking</h2>
          </div>
          <Link href="/account/bookings" className="text-sm font-medium text-forest-700 hover:underline dark:text-forest-400">View all</Link>
        </div>
        {upcomingBooking ? (
          <Link href={`/account/bookings/${upcomingBooking._id}`} className="mt-4 block rounded-3xl border border-border-base bg-bg-elevated p-6 transition-shadow hover:shadow-lg sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-wider text-fg-muted uppercase">{upcomingBooking.reference}</p>
                <h3 className="mt-1 font-display text-3xl font-medium">{upcomingBooking.room?.name ?? "Your Greenova stay"}</h3>
              </div>
              <Badge tone={statusTone(upcomingBooking.status)}>{upcomingBooking.status[0].toUpperCase() + upcomingBooking.status.slice(1)}</Badge>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-fg-muted">
              <span className="flex items-center gap-2"><CalendarDays className="size-4 text-forest-500" />{formatDate(upcomingBooking.checkIn)} to {formatDate(upcomingBooking.checkOut)}</span>
              <span>{upcomingBooking.nights} {upcomingBooking.nights === 1 ? "night" : "nights"}</span>
              <span className="font-medium text-fg">{formatCurrency(upcomingBooking.totalAmount)}</span>
            </div>
          </Link>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-border-base bg-bg-subtle p-8 text-center">
            <Clock3 className="mx-auto size-5 text-forest-500" />
            <p className="mt-3 font-medium">No upcoming stays yet.</p>
            <Link href="/rooms" className="mt-2 inline-block text-sm text-forest-700 hover:underline dark:text-forest-400">Plan your next escape</Link>
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-fg-muted uppercase">Timeline</p>
              <h2 className="mt-1 font-display text-3xl font-medium">Recent booking activity</h2>
            </div>
            <Link href="/account/bookings" className="text-sm font-medium text-forest-700 hover:underline dark:text-forest-400">History</Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
            {recentActivity.length ? (
              <ul className="divide-y divide-border-base">
                {recentActivity.map((booking) => (
                  <li key={booking._id}>
                    <Link href={`/account/bookings/${booking._id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-bg-subtle sm:px-6">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{booking.room?.name ?? "Greenova stay"}</p>
                        <p className="mt-0.5 text-xs text-fg-muted">{booking.reference} · Updated {formatDate(booking.updatedAt)}</p>
                      </div>
                      <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-10 text-center text-sm text-fg-muted">Your booking activity will appear here.</p>
            )}
          </div>
        </section>

        <section id="profile-details" className="scroll-mt-28 rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
          <p className="text-xs tracking-widest text-fg-muted uppercase">Personal details</p>
          <h2 className="mt-1 font-display text-3xl font-medium">Profile & contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">Keep these details current for future reservations. Existing booking details remain unchanged.</p>
          <div className="mt-6"><ProfileForm user={user} /></div>
        </section>
      </div>
    </div>
  );
}
