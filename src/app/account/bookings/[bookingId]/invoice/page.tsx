import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Leaf, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getBookingById, canAccessBooking } from "@/services/booking.service";
import { formatCurrency, formatDate } from "@/utils";
import PrintButton from "@/components/booking/PrintButton";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Printable invoice for one booking.
 *
 * Styled for paper as much as screen: the `print-hide` class strips the site
 * chrome and the action bar, so the browser's Print dialog (or Save as PDF)
 * produces a clean single-page document with no extra dependency.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/account/bookings/${bookingId}/invoice`)}`,
    );
  }

  const booking = await getBookingById(bookingId);
  if (!booking) notFound();

  // Only the guest who made the booking (or an admin) may view it.
  if (!canAccessBooking(booking, { id: session.user.id, role: session.user.role })) {
    notFound();
  }

  const room = booking.room;
  const paid = booking.payment.status === "paid";
  const unitCount = Math.max(1, booking.roomsBooked ?? 1);
  const nightlyRate = Math.round(booking.roomTotal / (booking.nights * unitCount));
  const paymentId = booking.payment.paymentId ?? booking.razorpayPaymentId;

  return (
    <div className="print-page min-h-screen bg-bg pt-28 pb-24 lg:pt-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Screen-only actions */}
        <div className="print-hide mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/account/bookings/${booking._id}`}
            className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            Back to booking
          </Link>
          <PrintButton />
        </div>

        <article className="invoice-sheet rounded-3xl border border-border-base bg-bg-elevated p-8 sm:p-12">
          {/* Branding */}
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border-base pb-8">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-forest-700">
                  <Leaf className="size-4 text-white" strokeWidth={2} />
                </span>
                <span className="font-display text-2xl font-semibold">Greenova</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                Greenova Retreat &amp; Spa
                <br />
                Canopy Ridge Road, Coorg
                <br />
                Karnataka 571201, India
                <br />
                stay@greenova.com · +91 1800 425 000
              </p>
            </div>

            <div className="text-right">
              <h1 className="font-display text-3xl font-light">Invoice</h1>
              <p className="mt-2 text-xs text-fg-muted">
                Reference
                <br />
                <span className="font-mono text-sm font-medium text-fg">
                  {booking.reference}
                </span>
              </p>
              <p className="mt-2 text-xs text-fg-muted">
                Issued {formatDate(booking.payment.paidAt ?? booking.createdAt)}
              </p>
              <p
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  paid
                    ? "bg-forest-50 text-forest-700 dark:bg-forest-900/60 dark:text-forest-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {paid ? "PAID" : booking.payment.status.toUpperCase()}
              </p>
            </div>
          </header>

          {/* Billed to */}
          <section className="grid gap-8 border-b border-border-base py-8 sm:grid-cols-2">
            <div>
              <h2 className="text-xs tracking-wider text-fg-muted uppercase">Billed to</h2>
              <p className="mt-2 text-sm font-medium text-fg">{booking.guest.name}</p>
              <p className="text-sm text-fg-muted">{booking.guest.email}</p>
              <p className="text-sm text-fg-muted">{booking.guest.phone}</p>
            </div>
            <div>
              <h2 className="text-xs tracking-wider text-fg-muted uppercase">Stay</h2>
              <p className="mt-2 text-sm text-fg">
                {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
              </p>
              <p className="text-sm text-fg-muted">
                {booking.nights} {booking.nights === 1 ? "night" : "nights"}
                {unitCount > 1 ? ` · ${unitCount} rooms` : ""} ·{" "}
                {booking.guests.adults + booking.guests.children} guests
              </p>
            </div>
          </section>

          {/* Line items */}
          <section className="py-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-base text-left text-xs tracking-wider text-fg-muted uppercase">
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                <tr>
                  <td className="py-4">
                    <p className="font-medium text-fg">{room?.name ?? "Accommodation"}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {room?.category ? `${room.category} · ` : ""}
                      {formatCurrency(nightlyRate)} per night × {booking.nights}{" "}
                      {booking.nights === 1 ? "night" : "nights"}
                      {unitCount > 1 ? ` × ${unitCount} rooms` : ""}
                    </p>
                  </td>
                  <td className="py-4 text-right whitespace-nowrap">
                    {formatCurrency(booking.roomTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-4">
                    <p className="text-fg">Taxes and fees</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      GST and any one-off charges
                    </p>
                  </td>
                  <td className="py-4 text-right whitespace-nowrap">
                    {formatCurrency(booking.taxes)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-base">
                  <td className="pt-4 font-display text-lg font-medium">
                    Total {paid ? "paid" : "due"}
                  </td>
                  <td className="pt-4 text-right font-display text-lg font-medium whitespace-nowrap">
                    {formatCurrency(booking.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Payment reference */}
          {(paymentId || booking.payment.orderId) && (
            <section className="border-t border-border-base py-6">
              <h2 className="text-xs tracking-wider text-fg-muted uppercase">
                Payment details
              </h2>
              <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                {paymentId && (
                  <div className="min-w-0">
                    <dt className="text-fg-muted">Payment ID</dt>
                    <dd className="mt-0.5 truncate font-mono text-fg">{paymentId}</dd>
                  </div>
                )}
                {booking.payment.orderId && (
                  <div className="min-w-0">
                    <dt className="text-fg-muted">Order ID</dt>
                    <dd className="mt-0.5 truncate font-mono text-fg">
                      {booking.payment.orderId}
                    </dd>
                  </div>
                )}
                <div className="min-w-0">
                  <dt className="text-fg-muted">Method</dt>
                  <dd className="mt-0.5 text-fg capitalize">{booking.payment.provider}</dd>
                </div>
              </dl>
            </section>
          )}

          <footer className="border-t border-border-base pt-6 text-xs leading-relaxed text-fg-muted">
            <p>
              Rates include breakfast, the spa circuit and the morning guided walk. This
              document is computer generated and valid without a signature.
            </p>
            <p className="mt-2">
              {booking.status === "cancelled"
                ? "This booking was cancelled."
                : room?.cancellationPolicy ??
                  "Free cancellation up to 48 hours before arrival."}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
