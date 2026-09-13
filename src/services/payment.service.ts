import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { createOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { getRoomAvailability } from "@/services/availability.service";
import { BookingError } from "@/services/booking.service";
import { serialize } from "@/utils";
import type { BookingDTO } from "@/types/models";
import type { VerifyPaymentInput } from "@/validators/payment";

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: "razorpay" | "mock";
  keyId: string | null;
  reference: string;
  guest: { name: string; email: string; phone: string };
}

/**
 * Creates a gateway order for a booking the caller owns.
 *
 * Availability is re-checked, excluding this booking's own held unit, so a
 * guest retrying payment is not blocked by their own pending reservation.
 */
export async function createPaymentOrder(
  bookingId: string,
  userId: string,
): Promise<OrderResult> {
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new BookingError(400, "Invalid booking id.");
  }

  await connectDB();
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new BookingError(404, "Booking not found.");
  if (String(booking.user) !== userId) {
    throw new BookingError(403, "You cannot pay for this booking.");
  }
  if (booking.payment.status === "paid") throw new BookingError(400, "Already paid.");
  if (booking.status === "cancelled") {
    throw new BookingError(400, "This booking was cancelled.");
  }
  if (
    booking.status === "pending" &&
    booking.paymentHoldExpiresAt &&
    booking.paymentHoldExpiresAt <= new Date()
  ) {
    booking.status = "cancelled";
    booking.bookingStatus = "CANCELLED";
    booking.cancelledAt = new Date();
    booking.cancellationReason = "Payment hold expired";
    await booking.save();
    throw new BookingError(409, "Your payment hold expired. Please make a new reservation.");
  }

  const { available } = await getRoomAvailability(
    booking.room,
    booking.checkIn,
    booking.checkOut,
    String(booking._id),
    booking.roomsBooked ?? 1,
  );
  if (!available) throw new BookingError(409, "Those dates are no longer available.");

  // Razorpay orders accept another payment attempt. Reusing the current order
  // keeps delayed payment webhooks attached to this booking and makes retry
  // idempotent instead of replacing the order identifier.
  if (booking.payment.orderId) {
    return {
      orderId: booking.payment.orderId,
      amount: booking.totalAmount,
      currency: "INR",
      provider: booking.payment.provider,
      keyId:
        booking.payment.provider === "razorpay"
          ? process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null
          : null,
      reference: booking.reference,
      guest: booking.guest,
    };
  }

  const order = await createOrder(booking.totalAmount, booking.reference, {
    bookingId: String(booking._id),
    reference: booking.reference,
  });

  booking.payment.orderId = order.orderId;
  booking.payment.provider = order.provider;
  booking.razorpayOrderId = order.orderId;
  booking.paymentMethod = order.provider;
  await booking.save();

  return {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    provider: order.provider,
    keyId: order.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
    reference: booking.reference,
    guest: booking.guest,
  };
}

/**
 * Verifies a gateway callback and confirms the booking.
 *
 * Idempotent: a repeated callback returns the already-confirmed booking
 * rather than double-processing.
 */
export async function verifyPayment(
  data: VerifyPaymentInput,
  userId: string,
): Promise<{ booking: BookingDTO; alreadyPaid: boolean }> {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  if (!mongoose.isValidObjectId(bookingId)) {
    throw new BookingError(400, "Invalid booking id.");
  }

  await connectDB();
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new BookingError(404, "Booking not found.");
  if (String(booking.user) !== userId) throw new BookingError(403, "Not your booking.");

  if (booking.payment.status === "paid") {
    return {
      booking: serialize(booking.toObject()) as unknown as BookingDTO,
      alreadyPaid: true,
    };
  }

  // The order id must match the one issued for this booking.
  if (booking.payment.orderId !== razorpay_order_id) {
    throw new BookingError(400, "Payment does not match this booking.");
  }

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    booking.payment.status = "failed";
    booking.paymentStatus = "FAILED";
    booking.bookingStatus = "PAYMENT_PENDING";
    await booking.save();
    throw new BookingError(400, "Payment verification failed.");
  }

  // The pending booking already holds one unit, but check again immediately
  // before confirmation as a final defence against stale or legacy data.
  const { unitsLeft } = await getRoomAvailability(
    booking.room,
    booking.checkIn,
    booking.checkOut,
    String(booking._id),
  );
  if (unitsLeft < (booking.roomsBooked ?? 1)) {
    throw new BookingError(409, "This stay can no longer be confirmed because inventory changed.");
  }

  booking.payment.status = "paid";
  booking.payment.paymentId = razorpay_payment_id;
  booking.payment.signature = razorpay_signature;
  booking.payment.paidAt = new Date();
  booking.status = "confirmed";
  booking.paymentStatus = "PAID";
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.razorpaySignature = razorpay_signature;
  booking.bookingStatus = "CONFIRMED";
  booking.paymentHoldExpiresAt = undefined;
  await booking.save();

  return {
    booking: serialize(booking.toObject()) as unknown as BookingDTO,
    alreadyPaid: false,
  };
}

/** Applies a verified webhook event. Returns false when nothing matched. */
export async function applyWebhookEvent(
  event: string,
  entity: { id: string; order_id: string },
): Promise<boolean> {
  await connectDB();
  const booking = await Booking.findOne({ "payment.orderId": entity.order_id });
  if (!booking) return false;

  if (event === "payment.captured" && booking.payment.status !== "paid") {
    // A signed webhook is trusted for payment capture, but confirmation still
    // must obey the same inventory invariant as the browser verification path.
    const { unitsLeft } = await getRoomAvailability(
      booking.room,
      booking.checkIn,
      booking.checkOut,
      String(booking._id),
    );
    if (unitsLeft < (booking.roomsBooked ?? 1)) {
      console.error("[payment] refusing confirmation because inventory is exhausted", booking._id);
      return false;
    }

    booking.payment.status = "paid";
    booking.payment.paymentId = entity.id;
    booking.payment.paidAt = new Date();
    booking.status = "confirmed";
    booking.paymentStatus = "PAID";
    booking.razorpayPaymentId = entity.id;
    booking.bookingStatus = "CONFIRMED";
    booking.paymentHoldExpiresAt = undefined;
    await booking.save();
    return true;
  }

  if (event === "payment.failed" && booking.payment.status === "pending") {
    booking.payment.status = "failed";
    booking.paymentStatus = "FAILED";
    booking.bookingStatus = "PAYMENT_PENDING";
    await booking.save();
    return true;
  }

  return false;
}
