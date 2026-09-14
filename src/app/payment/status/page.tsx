import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  CalendarCheck,
  FileText,
  Leaf,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getBookingById, canAccessBooking } from "@/services/booking.service";
import { LinkButton } from "@/components/ui/Button";
import BookingSummary from "@/components/booking/BookingSummary";

export const metadata: Metadata = {
  title: "Payment Status",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Post-payment outcome for one booking, reached as
 * /payment/status?booking=<id>. The booking id travels in the query rather
 * than the path so a gateway or webhook can redirect here generically.
 */
export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId } = await searchParams;
  const session = await auth();

  const target = `/payment/status${bookingId ? `?booking=${bookingId}` : ""}`;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);

  // No id at all: send them somewhere useful rather than showing an empty shell.
  if (!bookingId) redirect("/account/bookings");

  const booking = await getBookingById(bookingId);
  if (!booking) notFound();

  // Only the guest who made the booking (or an admin) may view it.
  if (!canAccessBooking(booking, { id: session.user.id, role: session.user.role })) {
    notFound();
  }

  // Payment and booking have deliberately separate lifecycle states. The
  // canonical payment state decides this screen; the legacy projection keeps
  // existing records readable during migration.
  const paid = booking.paymentStatus === "PAID" || booking.payment.status === "paid";
  const failed = booking.paymentStatus === "FAILED" || booking.payment.status === "failed";
  const refunded =
    booking.paymentStatus === "REFUNDED" || booking.payment.status === "refunded";

  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Branding: this page is often the first thing a guest screenshots. */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-forest-700 dark:bg-forest-600">
            <Leaf className="size-4 text-white" strokeWidth={2} />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">Greenova</span>
        </div>

        <div className="text-center">
          {paid ? (
            <>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-forest-50 dark:bg-forest-900/60">
                <CheckCircle2
                  className="size-8 text-forest-600 dark:text-forest-400"
                  strokeWidth={1.5}
                />
              </span>
              <h1 className="mt-6 font-display text-4xl leading-tight font-light sm:text-5xl">
                Your stay is confirmed
              </h1>
              <p className="mt-3 text-base text-fg-muted">
                We have sent the details to {booking.guest.email}. We look forward to
                welcoming you.
              </p>
            </>
          ) : refunded ? (
            <>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-brass-100 dark:bg-brass-900/40">
                <RotateCcw
                  className="size-8 text-brass-700 dark:text-brass-300"
                  strokeWidth={1.5}
                />
              </span>
              <h1 className="mt-6 font-display text-4xl leading-tight font-light sm:text-5xl">
                Payment refunded
              </h1>
              <p className="mt-3 text-base text-fg-muted">
                The full amount is on its way back to your original payment method, usually
                within five to seven working days.
              </p>
            </>
          ) : failed ? (
            <>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 dark:bg-red-950/40">
                <XCircle className="size-8 text-red-600 dark:text-red-400" strokeWidth={1.5} />
              </span>
              <h1 className="mt-6 font-display text-4xl leading-tight font-light sm:text-5xl">
                Payment did not go through
              </h1>
              <p className="mt-3 text-base text-fg-muted">
                Nothing has been charged. Your room is held briefly — you can retry the
                payment from your bookings.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                <Clock className="size-8 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
              </span>
              <h1 className="mt-6 font-display text-4xl leading-tight font-light sm:text-5xl">
                Awaiting payment
              </h1>
              <p className="mt-3 text-base text-fg-muted">
                We are holding this room for you. Complete payment to confirm the
                reservation.
              </p>
            </>
          )}
        </div>

        <div className="mt-10">
          <BookingSummary booking={booking} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href={`/account/bookings/${booking._id}`}>
            <CalendarCheck className="size-4" />
            View Booking
          </LinkButton>
          <LinkButton href="/account/bookings" variant="outline">
            My Bookings
          </LinkButton>
          {paid && (
            <LinkButton
              href={`/account/bookings/${booking._id}/invoice`}
              variant="outline"
            >
              <FileText className="size-4" />
              View invoice
            </LinkButton>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-fg-muted">
          <Link href="/rooms" className="underline underline-offset-4 hover:text-fg">
            Book another stay
          </Link>
        </p>

        <p className="mt-8 text-center text-sm text-fg-muted">
          Questions about your stay?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-fg">
            Get in touch
          </Link>
        </p>
      </div>
    </div>
  );
}
