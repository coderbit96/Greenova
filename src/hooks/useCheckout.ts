"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBookingAction } from "@/actions/booking.actions";
import { createOrderAction, verifyPaymentAction } from "@/actions/payment.actions";
import { openRazorpayCheckout } from "@/lib/checkout";
import type { BookingInput } from "@/validators/booking";

export type CheckoutStep = "idle" | "creating" | "paying" | "verifying" | "done";

/**
 * Drives the booking → order → gateway → verify sequence.
 *
 * The component that uses this only renders a form and a status; every
 * network call, ordering rule and failure path lives here.
 */
export function useCheckout() {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>("idle");

  const busy = step !== "idle" && step !== "done";

  const start = useCallback(
    async (input: BookingInput) => {
      setStep("creating");

      // 1. Create the booking. The server recomputes the price and re-checks
      //    availability, so nothing here is trusted from the client.
      let created;
      try {
        created = await createBookingAction(input);
      } catch {
        toast.error("Could not create the booking. Please try again.");
        setStep("idle");
        return;
      }
      if (!created.ok) {
        toast.error(created.error);
        setStep("idle");
        return;
      }

      const bookingId = created.data._id;

      // 2. Open a gateway order for it.
      let order;
      try {
        order = await createOrderAction(bookingId);
      } catch {
        toast.error("Could not start payment. Please try again.");
        setStep("idle");
        return;
      }
      if (!order.ok) {
        toast.error(order.error);
        // The booking exists but is unpaid — send them to it so they can retry
        // rather than silently stranding a pending reservation.
        setStep("idle");
        router.push(`/payment/status?booking=${bookingId}`);
        return;
      }

      if (order.data.provider === "mock") {
        toast.info("Demo mode — simulating a successful payment.");
      }

      // 3. Hand off to the gateway.
      setStep("paying");
      let result;
      try {
        result = await openRazorpayCheckout(order.data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Payment cancelled.");
        router.push(`/payment/status?booking=${bookingId}`);
        return;
      }

      // 4. Verify server-side before treating it as confirmed.
      setStep("verifying");
      let verified;
      try {
        verified = await verifyPaymentAction({ bookingId, ...result });
      } catch {
        toast.error("We could not verify the payment yet. Check your booking status before paying again.");
        setStep("done");
        router.push(`/payment/status?booking=${bookingId}`);
        return;
      }

      if (!verified.ok) {
        toast.error(verified.error);
      } else {
        toast.success("Your stay is confirmed.");
      }

      setStep("done");
      router.push(`/payment/status?booking=${bookingId}`);
    },
    [router],
  );

  return { step, busy, start };
}
