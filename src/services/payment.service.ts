import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import PaymentWebhookEvent from "@/models/PaymentWebhookEvent";
import { createOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { getRoomAvailability } from "@/services/availability.service";
import { BookingError } from "@/services/booking.service";
import { releaseCoupon } from "@/services/coupon.service";
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

export interface RazorpayWebhookPayload {
  payment?: {
    id?: string;
    order_id?: string;
    amount?: number;
    amount_refunded?: number;
  };
  refund?: {
    id?: string;
    payment_id?: string;
    amount?: number;
  };
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
  if (booking.bookingSource === "ADMIN_MANUAL" && booking.paymentMethod !== "razorpay") {
    throw new BookingError(400, "This is an offline booking. Please pay the hotel directly.");
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
    await releaseCoupon(booking.couponCode);
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
          ? process.env.RAZORPAY_KEY_ID ?? null
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
    keyId: order.keyId,
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

  // A successful popup may reach us after its inventory hold expires. Do not
  // turn a stale checkout callback into a confirmed stay.
  if (
    booking.status === "cancelled" ||
    (booking.paymentHoldExpiresAt && booking.paymentHoldExpiresAt <= new Date())
  ) {
    throw new BookingError(409, "This payment session has expired. Please make a new reservation.");
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

  // Compare-and-set makes a browser callback and a payment.captured webhook
  // race safe: exactly one can perform the pending -> paid transition.
  const paidBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, "payment.orderId": razorpay_order_id, "payment.status": { $ne: "paid" } },
    {
      $set: {
        "payment.status": "paid",
        "payment.paymentId": razorpay_payment_id,
        "payment.signature": razorpay_signature,
        "payment.paidAt": new Date(),
        status: "confirmed",
        paymentStatus: "PAID",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        bookingStatus: "CONFIRMED",
      },
      $unset: { paymentHoldExpiresAt: 1 },
    },
    { returnDocument: "after" },
  );

  if (!paidBooking) {
    const latest = await Booking.findById(booking._id);
    if (latest?.payment.status === "paid") {
      return {
        booking: serialize(latest.toObject()) as unknown as BookingDTO,
        alreadyPaid: true,
      };
    }
    throw new BookingError(409, "Payment state changed. Please check your booking status.");
  }

  return {
    booking: serialize(paidBooking.toObject()) as unknown as BookingDTO,
    alreadyPaid: false,
  };
}

/**
 * Applies a signature-verified Razorpay webhook exactly once.
 *
 * Inserting the receipt first is the atomic delivery guard. If processing
 * fails we remove that receipt so Razorpay can retry instead of being falsely
 * acknowledged as handled.
 */
export async function applyWebhookEvent(
  event: string,
  payload: RazorpayWebhookPayload,
  eventKey: string,
): Promise<boolean> {
  await connectDB();
  const payment = payload.payment;
  const refund = payload.refund;
  const orderId = payment?.order_id;
  const paymentId = payment?.id ?? refund?.payment_id;

  try {
    await PaymentWebhookEvent.create({ eventKey, event, orderId, paymentId });
  } catch (err) {
    if (isDuplicateKeyError(err)) return false;
    throw err;
  }

  try {
    if (event === "refund.created") {
      if (!refund?.payment_id) return false;
      const booking = await Booking.findOne({ "payment.paymentId": refund.payment_id });
      if (!booking || booking.paymentStatus === "REFUNDED") return false;

      booking.bookingStatus = "REFUND_PENDING";
      await booking.save();
      return true;
    }

    if (event === "refund.processed") {
      if (!refund?.payment_id) return false;
      const booking = await Booking.findOne({ "payment.paymentId": refund.payment_id });
      if (!booking) return false;

      const refundAmount = refund.amount ?? payment?.amount_refunded ?? booking.totalAmount;
      const fullyRefunded = refundAmount >= booking.totalAmount;
      if (
        booking.paymentStatus === "REFUNDED" ||
        (!fullyRefunded && booking.paymentStatus === "PARTIALLY_REFUNDED")
      ) {
        return false;
      }

      booking.payment.status = "refunded";
      booking.payment.refundedAt = new Date();
      booking.paymentStatus = fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED";
      booking.bookingStatus = "REFUNDED";
      await booking.save();
      return true;
    }

    if (event === "refund.failed") {
      if (!refund?.payment_id) return false;
      const booking = await Booking.findOne({ "payment.paymentId": refund.payment_id });
      if (!booking || booking.bookingStatus !== "REFUND_PENDING") return false;

      booking.bookingStatus = "CANCELLED";
      await booking.save();
      return true;
    }

    if (!orderId) return false;
    const booking = await Booking.findOne({ "payment.orderId": orderId });
    if (!booking) return false;

    if (event === "payment.captured" && booking.payment.status !== "paid" && payment?.id) {
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

      const confirmed = await Booking.findOneAndUpdate(
        { _id: booking._id, "payment.status": { $ne: "paid" } },
        {
          $set: {
            "payment.status": "paid",
            "payment.paymentId": payment.id,
            "payment.paidAt": new Date(),
            status: "confirmed",
            paymentStatus: "PAID",
            razorpayPaymentId: payment.id,
            bookingStatus: "CONFIRMED",
          },
          $unset: { paymentHoldExpiresAt: 1 },
        },
        { returnDocument: "after" },
      );
      return Boolean(confirmed);
    }

    if (event === "payment.failed" && booking.payment.status === "pending") {
      booking.payment.status = "failed";
      booking.paymentStatus = "FAILED";
      booking.bookingStatus = "PAYMENT_PENDING";
      await booking.save();
      return true;
    }

    return false;
  } catch (err) {
    await PaymentWebhookEvent.deleteOne({ eventKey });
    throw err;
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}
