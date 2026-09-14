import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { getBookingById, canAccessBooking } from "@/services/booking.service";
import { getReviewForBooking } from "@/services/review.service";
import { formatDate } from "@/utils";
import BookingSummary from "@/components/booking/BookingSummary";
import BookingActions from "@/components/account/BookingActions";
import ReviewForm from "@/components/account/ReviewForm";
import Badge, { statusTone } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Booking Details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/account/bookings/${bookingId}`)}`);
  }

  const booking = await getBookingById(bookingId);
  if (!booking) notFound();

  // Only the guest who made the booking (or an admin) may view it.
  if (!canAccessBooking(booking, { id: session.user.id, role: session.user.role })) {
    notFound();
  }

  const reviewEligible = booking.status === "completed" || booking.bookingStatus === "CHECKED_OUT";
  const existingReview = reviewEligible
    ? await getReviewForBooking(booking._id, session.user.id)
    : null;

  return (
    <div>
      <Link
        href="/account/bookings"
        className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        All bookings
      </Link>

      <h1 className="mt-6 font-display text-4xl leading-tight font-light sm:text-5xl">
        {booking.room?.name ?? "Your booking"}
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Booked on {formatDate(booking.createdAt)}
      </p>

      <div className="mt-10">
        <BookingSummary booking={booking} />
      </div>

      <section className="mt-8 rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium">Manage this booking</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Eligible bookings can be cancelled until the day before arrival. Paid stays are refunded in full.
            </p>
          </div>
          <Link
            href={`/account/bookings/${booking._id}/invoice`}
            className="inline-flex items-center gap-2 rounded-full border border-border-base px-4 py-2 text-sm font-medium transition-colors hover:bg-bg-subtle"
          >
            <FileText className="size-4" /> View invoice
          </Link>
        </div>
        <div className="mt-6">
          <BookingActions booking={booking} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-bg-subtle p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-medium">
          <Receipt className="size-4 text-forest-500" />
          Guest details
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs tracking-wider text-fg-muted uppercase">Name</dt>
            <dd className="mt-1 text-sm text-fg">{booking.guest.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs tracking-wider text-fg-muted uppercase">Email</dt>
            <dd className="mt-1 truncate text-sm text-fg">{booking.guest.email}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-fg-muted uppercase">Phone</dt>
            <dd className="mt-1 text-sm text-fg">{booking.guest.phone}</dd>
          </div>
        </dl>

        {booking.cancellationReason && (
          <div className="mt-6 border-t border-border-base pt-5">
            <dt className="text-xs tracking-wider text-fg-muted uppercase">
              Cancellation reason
            </dt>
            <dd className="mt-1 text-sm text-fg">{booking.cancellationReason}</dd>
          </div>
        )}
      </section>

      {reviewEligible && (
        <section className="mt-6 rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium">Share your experience</h2>
          {existingReview ? (
            <div className="mt-4">
              <p className="text-sm text-fg-muted">Your review has been submitted.</p>
              <Badge className="mt-3" tone={statusTone(existingReview.status)}>
                {existingReview.status.toLowerCase()}
              </Badge>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-sm text-fg-muted">
                Your feedback helps future guests. Reviews are published after approval.
              </p>
              <ReviewForm bookingId={booking._id} />
            </>
          )}
        </section>
      )}

      <p className="mt-8 text-sm text-fg-muted">
        Need something changed?{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-fg">
          Write to us
        </Link>{" "}
        and we will handle it by hand.
      </p>
    </div>
  );
}
