"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CalendarDays, Users, BedDouble, ShieldCheck, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency, priceBreakdown, toUTCDay } from "@/utils";
import { useAvailability } from "@/hooks/useAvailability";
import { useStayDates } from "@/hooks/useStayDates";

interface Props {
  room: {
    _id: string;
    name: string;
    pricePerNight: number;
    /** Charged instead of pricePerNight when lower. */
    discountedPrice?: number;
    capacity: { adults: number; children: number };
    /** Overrides the default GST when set. */
    taxRatePercent?: number;
    additionalFees?: { label: string; amount: number }[];
    checkInTime?: string;
    checkOutTime?: string;
    cancellationPolicy?: string;
  };
  blockedDates: string[];
  initial?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    rooms?: number;
  };
}

export default function BookingPanel({ room, blockedDates, initial }: Props) {
  const router = useRouter();
  const { status } = useSession();

  const {
    checkIn, checkOut, adults, children, rooms,
    nights, today, minCheckOut,
    setCheckIn, setCheckOut, setAdults, setChildren, setRooms,
  } = useStayDates(initial);

  const { availability, checking } = useAvailability({
    roomId: room._id,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
  });

  /**
   * The full booking intent. Used as the destination when signed in and as
   * the login callback when not, so nothing the guest chose is re-entered.
   */
  const checkoutHref = `/checkout?${new URLSearchParams({
    roomId: room._id,
    checkIn,
    checkOut,
    adults: String(adults),
    children: String(children),
    rooms: String(rooms),
  })}`;

  const { nightlyRate, roomTotal, feesTotal, taxes, totalAmount } = priceBreakdown(
    room,
    Math.max(nights, 0),
    rooms,
  );

  // Warn when the selected range covers a night that is already sold out.
  const rangeHasBlockedNight = (() => {
    if (nights < 1) return false;
    const start = toUTCDay(checkIn).getTime();
    for (let i = 0; i < nights; i++) {
      const day = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      if (blockedDates.includes(day)) return true;
    }
    return false;
  })();

  function onReserve() {
    if (nights < 1) {
      toast.error("Choose at least one night.");
      return;
    }

    // Unauthenticated guests keep their room, dates and party size: the whole
    // checkout URL travels as the callback and is restored after sign-in.
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(checkoutHref)}`);
      return;
    }

    router.push(checkoutHref);
  }

  const soldOut = availability?.available === false;
  const disabled = nights < 1 || soldOut || checking;

  return (
    <div className="rounded-3xl border border-border-base bg-bg-elevated p-6 shadow-xl shadow-forest-950/5 sm:p-7">
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-light">
          {formatCurrency(room.pricePerNight)}
        </span>
        <span className="text-sm text-fg-muted">per night</span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check in" icon={<CalendarDays className="size-3.5" />}>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
              aria-label="Check-in date"
            />
          </Field>
          <Field label="Check out" icon={<CalendarDays className="size-3.5" />}>
            <input
              type="date"
              value={checkOut}
              min={minCheckOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
              aria-label="Check-out date"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Adults" icon={<Users className="size-3.5" />}>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full cursor-pointer bg-transparent text-sm font-medium outline-none"
              aria-label="Adults"
            >
              {Array.from({ length: room.capacity.adults }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Children" icon={<Users className="size-3.5" />}>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full cursor-pointer bg-transparent text-sm font-medium outline-none"
              aria-label="Children"
              disabled={room.capacity.children === 0}
            >
              {Array.from({ length: room.capacity.children + 1 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Rooms" icon={<BedDouble className="size-3.5" />}>
          <select
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="w-full cursor-pointer bg-transparent text-sm font-medium outline-none"
            aria-label="Rooms"
          >
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "room" : "rooms"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Availability feedback */}
      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {checking ? (
          <span className="flex items-center gap-2 text-fg-muted">
            <Loader2 className="size-3.5 animate-spin" />
            Checking availability…
          </span>
        ) : soldOut ? (
          <span className="text-red-600 dark:text-red-400">
            Not available for these dates. Try shifting your stay.
          </span>
        ) : availability?.available ? (
          <span className="text-emerald-600 dark:text-emerald-300">
            Available
            {availability.unitsLeft <= 2 && ` — only ${availability.unitsLeft} left`}
          </span>
        ) : rangeHasBlockedNight ? (
          <span className="text-amber-600 dark:text-amber-400">
            Some nights in this range are fully booked.
          </span>
        ) : null}
      </div>

      {/* Price breakdown */}
      {nights > 0 && (
        <dl className="mt-5 space-y-2.5 border-t border-border-base pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">
              {formatCurrency(nightlyRate)} × {nights} {nights === 1 ? "night" : "nights"}
            </dt>
            <dd className="text-fg">{formatCurrency(roomTotal)}</dd>
          </div>
          {feesTotal > 0 && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">Additional fees</dt>
              <dd className="text-fg">{formatCurrency(feesTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-fg-muted">Taxes</dt>
            <dd className="text-fg">{formatCurrency(taxes)}</dd>
          </div>
          <div className="flex justify-between border-t border-border-base pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatCurrency(totalAmount)}</dd>
          </div>
        </dl>
      )}

      <Button
        onClick={onReserve}
        disabled={disabled}
        size="lg"
        className="mt-6 w-full"
      >
        {status === "authenticated" ? "Reserve" : "Sign in to reserve"}
      </Button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-fg-muted">
        <ShieldCheck className="size-3.5" />
        {room.cancellationPolicy ?? "Free cancellation up to 48 hours before arrival."}
      </p>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col rounded-xl border border-border-base bg-bg px-3.5 py-2.5 transition-colors focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/25">
      <span className="mb-0.5 flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wider text-fg-muted uppercase">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
