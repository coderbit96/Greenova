"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelBookingAction } from "@/actions/booking.actions";
import { createOrderAction, verifyPaymentAction } from "@/actions/payment.actions";
import { openRazorpayCheckout } from "@/lib/checkout";

/** Cancel and retry-payment, shared by the guest bookings list. */
export function useBookingActions() {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const cancel = useCallback(
    async (bookingId: string, reason = "Cancelled by guest") => {
      setBusyId(bookingId);
      try {
        const result = await cancelBookingAction(bookingId, { reason });
        if (!result.ok) {
          toast.error(result.error);
          return false;
        }
        toast.success("Booking cancelled. Any payment will be refunded.");
        router.refresh();
        return true;
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  const payNow = useCallback(
    async (bookingId: string) => {
      setBusyId(bookingId);
      try {
        const order = await createOrderAction(bookingId);
        if (!order.ok) {
          toast.error(order.error);
          return false;
        }

        if (order.data.provider === "mock") {
          toast.info("Demo mode — simulating a successful payment.");
        }

        const result = await openRazorpayCheckout(order.data);
        const verified = await verifyPaymentAction({ bookingId, ...result });

        if (!verified.ok) {
          toast.error(verified.error);
          return false;
        }

        toast.success("Payment received. Your stay is confirmed.");
        router.refresh();
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Payment failed.");
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  return { busyId, cancel, payNow };
}
