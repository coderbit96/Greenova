import Image from "next/image";
import { CalendarDays, Users, MapPin, CreditCard, User } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";
import type { PopulatedBookingDTO } from "@/types/models";

const FALLBACK =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop";

/**
 * The reference block plus stay, guest, payment and price detail for one
 * booking.
 *
 * Shared by /payment/status and /account/bookings/[bookingId] so the two views
 * cannot drift apart — each supplies its own heading and actions around it.
 */
export default function BookingSummary({ booking }: { booking: PopulatedBookingDTO }) {
  const room = booking.room;
  const paid = booking.payment.status === "paid";

  // Rate per night per room: dividing the total by nights alone overstates it
  // once more than one room is on the booking.
  const unitCount = Math.max(1, booking.roomsBooked ?? 1);
  const nightlyRate = Math.round(booking.roomTotal / (booking.nights * unitCount));

  const paymentId = booking.payment.paymentId ?? booking.razorpayPaymentId;

  return (
    <>
      <div className="rounded-3xl border border-border-base bg-bg-subtle p-6 text-center">
        <p className="text-xs tracking-widest text-fg-muted uppercase">Booking reference</p>
        <p className="mt-2 font-display text-3xl font-medium tracking-wide">
          {booking.reference}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge tone={statusTone(booking.status)}>
            {booking.status[0].toUpperCase() + booking.status.slice(1)}
          </Badge>
          <Badge tone={statusTone(booking.payment.status)}>
            Payment: {booking.payment.status}
          </Badge>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
        <div className="relative h-52">
          <Image
            src={room?.thumbnail?.url ?? room?.images?.[0]?.url ?? FALLBACK}
            alt={room?.name ?? "Your suite"}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute right-6 bottom-5 left-6">
            {room?.category && (
              <p className="text-xs tracking-wider text-white/80 uppercase">{room.category}</p>
            )}
            <h2 className="font-display text-3xl font-light text-white">
              {room?.name ?? "Your suite"}
            </h2>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          <Detail
            icon={<CalendarDays className="size-4" />}
            label="Check in"
            value={formatDate(booking.checkIn, {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            hint={`From ${room?.checkInTime ?? "2:00 PM"}`}
          />
          <Detail
            icon={<CalendarDays className="size-4" />}
            label="Check out"
            value={formatDate(booking.checkOut, {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            hint={`Until ${room?.checkOutTime ?? "11:00 AM"}`}
          />
          <Detail
            icon={<Users className="size-4" />}
            label="Guests"
            value={`${booking.guests.adults} ${
              booking.guests.adults === 1 ? "adult" : "adults"
            }${booking.guests.children ? `, ${booking.guests.children} children` : ""}`}
            hint={`${booking.nights} ${booking.nights === 1 ? "night" : "nights"}${
              unitCount > 1 ? ` · ${unitCount} rooms` : ""
            }`}
          />
          <Detail
            icon={<MapPin className="size-4" />}
            label="Location"
            value="Greenova Retreat &amp; Spa"
            hint="Canopy Ridge Road, Coorg"
          />
        </div>

        {/* Guest information */}
        <div className="border-t border-border-base px-6 py-6 sm:px-8">
          <p className="flex items-center gap-1.5 text-xs tracking-wider text-fg-muted uppercase">
            <User className="size-3.5 text-forest-500" />
            Guest information
          </p>
          <dl className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs text-fg-muted">Name</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-fg">
                {booking.guest.name}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-fg-muted">Email</dt>
              <dd className="mt-0.5 truncate text-sm text-fg">{booking.guest.email}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-fg-muted">Phone</dt>
              <dd className="mt-0.5 truncate text-sm text-fg">{booking.guest.phone}</dd>
            </div>
          </dl>
        </div>

        {/* Payment reference — only meaningful once money has moved. */}
        {(paymentId || booking.payment.paidAt) && (
          <div className="border-t border-border-base px-6 py-6 sm:px-8">
            <p className="flex items-center gap-1.5 text-xs tracking-wider text-fg-muted uppercase">
              <CreditCard className="size-3.5 text-forest-500" />
              Payment
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              {paymentId && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-xs text-fg-muted">Payment ID</dt>
                  <dd className="mt-0.5 truncate font-mono text-sm text-fg">{paymentId}</dd>
                </div>
              )}
              {booking.payment.paidAt && (
                <div className="min-w-0">
                  <dt className="text-xs text-fg-muted">Paid on</dt>
                  <dd className="mt-0.5 text-sm text-fg">
                    {formatDate(booking.payment.paidAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {booking.specialRequests && (
          <div className="border-t border-border-base px-6 py-5 sm:px-8">
            <p className="text-xs tracking-wider text-fg-muted uppercase">Special requests</p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg">{booking.specialRequests}</p>
          </div>
        )}

        <dl className="space-y-2.5 border-t border-border-base bg-bg-subtle px-6 py-6 text-sm sm:px-8">
          <div className="flex justify-between">
            <dt className="text-fg-muted">
              {formatCurrency(nightlyRate)} × {booking.nights}{" "}
              {booking.nights === 1 ? "night" : "nights"}
              {unitCount > 1 ? ` × ${unitCount} rooms` : ""}
            </dt>
            <dd>{formatCurrency(booking.roomTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-muted">Taxes &amp; fees</dt>
            <dd>{formatCurrency(booking.taxes)}</dd>
          </div>
          <div className="flex justify-between border-t border-border-base pt-3 text-lg font-medium">
            <dt>Total {paid ? "paid" : "due"}</dt>
            <dd>{formatCurrency(booking.totalAmount)}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}

function Detail({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs tracking-wider text-fg-muted uppercase">
        <span className="text-forest-500">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 font-medium text-fg">{value}</p>
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
