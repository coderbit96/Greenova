"use client";

import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { useBookingActions } from "@/hooks/useBookingActions";
import { toUTCDay, todayUTC } from "@/utils";
import type { PopulatedBookingDTO } from "@/types/models";

/**
 * Cancel and retry-payment controls for a single booking.
 *
 * All orchestration lives in useBookingActions; this component only decides
 * which actions apply to the booking's current state and renders them.
 */
export default function BookingActions({ booking }: { booking: PopulatedBookingDTO }) {
  const { busyId, cancel, payNow } = useBookingActions();
  const [confirming, setConfirming] = useState(false);
  const busy = busyId === booking._id;

  const needsPayment =
    booking.payment.status !== "paid" &&
    booking.payment.status !== "refunded" &&
    booking.status !== "cancelled";

  const canCancel =
    booking.status !== "cancelled" &&
    booking.status !== "completed" &&
    toUTCDay(booking.checkIn) > todayUTC();

  if (!needsPayment && !canCancel) {
    return (
      <p className="text-sm text-fg-muted">
        {booking.status === "cancelled"
          ? "This booking has been cancelled."
          : booking.status === "completed"
            ? "We hope you enjoyed your stay."
            : "This booking is confirmed. Contact us if anything needs to change."}
      </p>
    );
  }

  function confirmCancel() {
    setConfirming(false);
    void cancel(booking._id);
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
      {needsPayment && (
        <Button loading={busy} onClick={() => void payNow(booking._id)}>
          <CreditCard className="size-4" />
          Complete payment
        </Button>
      )}
      {canCancel && (
        <Button variant="outline" disabled={busy} onClick={() => setConfirming(true)}>
          <X className="size-4" />
          Cancel booking
        </Button>
      )}
      </div>
      <ConfirmationDialog
        open={confirming}
        title="Cancel this booking?"
        description={`Cancel booking ${booking.reference}? Any eligible payment will be refunded according to the cancellation policy.`}
        confirmLabel="Cancel booking"
        onClose={() => setConfirming(false)}
        onConfirm={confirmCancel}
        busy={busy}
      />
    </>
  );
}
