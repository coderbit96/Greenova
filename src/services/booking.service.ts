import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import "@/models/User"; // register the schema for populate()
import { getRoomAvailability } from "@/services/availability.service";
import { refundPayment } from "@/lib/razorpay";
import { reserveCoupon, releaseCoupon } from "@/services/coupon.service";
import {
  generateReference,
  nightsBetween,
  priceBreakdown,
  serialize,
  toUTCDay,
  todayUTC,
} from "@/utils";
import type { BookingDTO, BookingStatus, PopulatedBookingDTO } from "@/types/models";
import type { BookingInput, UpdateBookingInput } from "@/validators/booking";

/** Domain error carrying the HTTP status the API layer should surface. */
export class BookingError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

const MAX_NIGHTS = 30;
/** Unpaid stays reserve inventory long enough to complete or retry payment. */
export const PAYMENT_HOLD_MS = 15 * 60 * 1000;
const RESERVATION_LOCK_MS = 10_000;
const RESERVATION_LOCK_RETRIES = 40;
const RESERVATION_LOCK_WAIT_MS = 50;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Serializes the count-and-create critical section for a room type.
 *
 * MongoDB transactions require a replica set, while local MongoDB instances
 * are commonly standalone. This conditional, expiring document lease is an
 * atomic MongoDB operation in either topology. Every guest reservation is
 * created through this service, so two requests cannot both observe the last
 * unit as free before one writes its pending booking.
 */
async function withReservationLock<T>(roomId: string, operation: () => Promise<T>): Promise<T> {
  const token = new mongoose.Types.ObjectId().toString();
  let acquired = false;

  for (let attempt = 0; attempt < RESERVATION_LOCK_RETRIES; attempt++) {
    const now = new Date();
    const locked = await Room.findOneAndUpdate(
      {
        _id: roomId,
        active: true,
        $or: [
          { "reservationLock.token": { $exists: false } },
          { "reservationLock.expiresAt": { $lte: now } },
        ],
      },
      {
        $set: {
          reservationLock: { token, expiresAt: new Date(now.getTime() + RESERVATION_LOCK_MS) },
        },
      },
      { returnDocument: "before" },
    ).lean();

    if (locked) {
      acquired = true;
      break;
    }
    await wait(RESERVATION_LOCK_WAIT_MS);
  }

  if (!acquired) {
    throw new BookingError(409, "This room is being reserved. Please try again in a moment.");
  }

  try {
    return await operation();
  } finally {
    // Do not clear a lease that expired and was acquired by another request.
    await Room.updateOne(
      { _id: roomId, "reservationLock.token": token },
      { $unset: { reservationLock: 1 } },
    );
  }
}

export async function listUserBookings(userId: string): Promise<PopulatedBookingDTO[]> {
  await connectDB();
  const bookings = await Booking.find({ user: userId })
    .populate("room", "name slug images bedType pricePerNight")
    .sort({ checkIn: -1 })
    .lean();
  return serialize(bookings) as unknown as PopulatedBookingDTO[];
}

export async function getBookingById(id: string): Promise<PopulatedBookingDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const booking = await Booking.findById(id).populate("room").lean();
  return booking ? (serialize(booking) as unknown as PopulatedBookingDTO) : null;
}

/** True when the viewer owns the booking or is an administrator. */
export function canAccessBooking(
  booking: { user: string | { toString(): string } },
  viewer: { id: string; role: string },
): boolean {
  return String(booking.user) === viewer.id || viewer.role === "admin";
}

/**
 * Creates a pending booking.
 *
 * The price is recomputed here from the room record — the client sends dates
 * and a room id, never an amount — and availability is re-checked so two
 * guests cannot take the last unit.
 */
export async function createBooking(
  userId: string,
  data: BookingInput,
): Promise<BookingDTO> {
  if (!mongoose.isValidObjectId(data.roomId)) {
    throw new BookingError(400, "Invalid room.");
  }

  const checkIn = toUTCDay(data.checkIn);
  const checkOut = toUTCDay(data.checkOut);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new BookingError(400, "Enter valid check-in and check-out dates.");
  }

  if (checkIn < todayUTC()) {
    throw new BookingError(400, "Check-in cannot be in the past.");
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new BookingError(400, "Stay must be at least one night.");
  if (nights > MAX_NIGHTS) {
    throw new BookingError(400, `Stays are limited to ${MAX_NIGHTS} nights.`);
  }

  await connectDB();

  return withReservationLock(data.roomId, async () => {
    const room = await Room.findById(data.roomId).lean();
    if (!room || !room.active) throw new BookingError(404, "Room not found.");

    if (data.adults > room.capacity.adults || data.children > room.capacity.children) {
      throw new BookingError(
        400,
        `This room accommodates up to ${room.capacity.adults} adults.`,
      );
    }

    // Do not use an earlier client availability response: count overlapping
    // holds and the requested quantity while the room type is locked.
    const { unitsLeft } = await getRoomAvailability(room._id, checkIn, checkOut);
    if (unitsLeft < data.roomsBooked) {
      throw new BookingError(409, "Sorry, this room was just booked for those dates.");
    }

    const basePrice = priceBreakdown(room, nights, data.roomsBooked);
    const coupon = await reserveCoupon({
      code: data.couponCode,
      userId,
      roomId: String(room._id),
      roomAmount: basePrice.roomTotal,
    });
    const { roomSubtotal, roomTotal, discountAmount, feesTotal, taxes, totalAmount } =
      priceBreakdown(room, nights, data.roomsBooked, coupon.discountAmount);
    const nameParts = data.guestName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? data.guestName;
    const lastName = nameParts.slice(1).join(" ");
    const reference = generateReference();
    let booking;
    try {
      booking = await Booking.create({
      bookingId: reference,
      reference,
      userId: userId,
      user: userId,
      roomId: room._id,
      room: room._id,
      roomType: room.category,
      roomsBooked: data.roomsBooked,
      guest: {
        name: data.guestName,
        firstName,
        lastName: lastName || undefined,
        email: data.guestEmail,
        phone: data.guestPhone,
        address: data.guestAddress || undefined,
      },
      checkIn,
      checkOut,
      nights,
      guests: { adults: data.adults, children: data.children },
      adults: data.adults,
      children: data.children,
      numberOfGuests: data.adults + data.children,
      numberOfNights: nights,
      roomTotal,
      taxes,
      totalAmount,
      roomAmount: roomSubtotal,
      discountAmount,
      taxAmount: taxes,
      additionalCharges: feesTotal,
      grandTotal: totalAmount,
      couponCode: coupon.couponCode,
      paymentMethod: "razorpay",
      paymentStatus: "PENDING",
      bookingStatus: "PAYMENT_PENDING",
      paymentHoldExpiresAt: new Date(Date.now() + PAYMENT_HOLD_MS),
      specialRequests: data.specialRequests || undefined,
      status: "pending",
      payment: { status: "pending" },
      });
    } catch (error) {
      await releaseCoupon(coupon.couponCode);
      throw error;
    }

    return serialize(booking.toObject()) as unknown as BookingDTO;
  });
}

/**
 * Cancels a booking and refunds any captured payment.
 *
 * A refund failure does not block the cancellation — the guest is released
 * and the refund reconciled from the admin panel, rather than trapping them
 * in a reservation because the gateway is down.
 */
export async function cancelBooking(
  id: string,
  viewer: { id: string; role: string },
  reason = "Cancelled by guest",
): Promise<BookingDTO> {
  if (!mongoose.isValidObjectId(id)) throw new BookingError(400, "Invalid booking id.");

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) throw new BookingError(404, "Booking not found.");

  if (!canAccessBooking(booking as never, viewer)) {
    throw new BookingError(403, "You cannot cancel this booking.");
  }

  if (booking.status === "cancelled") throw new BookingError(400, "Already cancelled.");
  if (booking.status === "completed") {
    throw new BookingError(400, "Completed stays cannot be cancelled.");
  }
  if (booking.checkIn <= todayUTC() && viewer.role !== "admin") {
    throw new BookingError(
      400,
      "Bookings cannot be cancelled on or after the check-in date.",
    );
  }

  if (booking.payment.status === "paid" && booking.payment.paymentId) {
    try {
      await refundPayment(booking.payment.paymentId, booking.totalAmount);
      booking.payment.status = "refunded";
      booking.payment.refundedAt = new Date();
      booking.paymentStatus = "REFUNDED";
      booking.bookingStatus = "REFUNDED";
    } catch (err) {
      console.error("[refund] failed for booking", booking.reference, err);
      booking.bookingStatus = "REFUND_PENDING";
    }
  }

  booking.status = "cancelled";
  if (booking.bookingStatus !== "REFUNDED" && booking.bookingStatus !== "REFUND_PENDING") {
    booking.bookingStatus = "CANCELLED";
  }
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason.slice(0, 500);
  await booking.save();
  await releaseCoupon(booking.couponCode);

  return serialize(booking.toObject()) as unknown as BookingDTO;
}

/* ── Admin ─────────────────────────────────────────────────── */

export interface AdminBookingQuery {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function listAllBookings(query: AdminBookingQuery = {}) {
  await connectDB();

  const { status, q, page = 1, limit = 20 } = query;
  const filter: Record<string, unknown> = {};

  if (status && status !== "all") filter.status = status;
  if (q) {
    filter.$or = [
      { reference: { $regex: q, $options: "i" } },
      { "guest.name": { $regex: q, $options: "i" } },
      { "guest.email": { $regex: q, $options: "i" } },
    ];
  }

  const safeLimit = Math.min(100, Math.max(1, limit));
  const safePage = Math.max(1, page);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("room", "name slug images")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings: serialize(bookings) as unknown as PopulatedBookingDTO[],
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

export async function updateBookingAsAdmin(
  id: string,
  data: UpdateBookingInput,
  adminId?: string,
): Promise<BookingDTO> {
  if (!mongoose.isValidObjectId(id)) throw new BookingError(400, "Invalid booking id.");

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) throw new BookingError(404, "Booking not found.");

  if (data.status) {
    booking.status = data.status as BookingStatus;
    if (data.status === "cancelled") {
      booking.cancelledAt = new Date();
      booking.cancellationReason = data.cancellationReason ?? "Cancelled by hotel";
      booking.bookingStatus = "CANCELLED";
    } else if (data.status === "confirmed") {
      booking.bookingStatus = "CONFIRMED";
    } else if (data.status === "completed") {
      booking.bookingStatus = "CHECKED_OUT";
    } else if (data.status === "pending") {
      booking.bookingStatus = "PAYMENT_PENDING";
    }
  }

  if (data.bookingStatus) {
    booking.bookingStatus = data.bookingStatus;
    if (data.bookingStatus === "CONFIRMED" || data.bookingStatus === "CHECKED_IN") booking.status = "confirmed";
    if (data.bookingStatus === "CHECKED_OUT") booking.status = "completed";
    if (data.bookingStatus === "CANCELLED" || data.bookingStatus === "NO_SHOW") booking.status = "cancelled";
  }
  if (data.internalNote && adminId && mongoose.isValidObjectId(adminId)) {
    booking.internalNotes.push({ text: data.internalNote, author: new mongoose.Types.ObjectId(adminId), createdAt: new Date() });
  }

  if (data.refund && booking.payment.status === "paid" && booking.payment.paymentId) {
    await refundPayment(booking.payment.paymentId, booking.totalAmount);
    booking.payment.status = "refunded";
    booking.payment.refundedAt = new Date();
    booking.paymentStatus = "REFUNDED";
    booking.bookingStatus = "REFUNDED";
  }

  await booking.save();
  return serialize(booking.toObject()) as unknown as BookingDTO;
}


/* --- Admin: money ------------------------------------------------------- */

export interface PaymentsSummary {
  payments: PopulatedBookingDTO[];
  /** Paise collected. */
  totalPaid: number;
  /** Paise still owed on bookings that are not cancelled. */
  totalPending: number;
}

/**
 * Every booking that has a payment record, newest first. Bookings are the
 * source of truth for money here — there is no separate payments collection.
 */
export async function listPayments(limit = 100): Promise<PaymentsSummary> {
  await connectDB();

  const [payments, paidAgg, pendingAgg] = await Promise.all([
    Booking.find({})
      .populate("room", "name slug")
      .sort({ "payment.paidAt": -1, createdAt: -1 })
      .limit(limit)
      .lean(),
    Booking.aggregate<{ total: number }>([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate<{ total: number }>([
      { $match: { "payment.status": "pending", status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return {
    payments: serialize(payments) as unknown as PopulatedBookingDTO[],
    totalPaid: paidAgg[0]?.total ?? 0,
    totalPending: pendingAgg[0]?.total ?? 0,
  };
}

export interface RefundsSummary {
  refunds: PopulatedBookingDTO[];
  totalRefunded: number;
}

/** Bookings whose payment was returned to the guest. */
export async function listRefunds(): Promise<RefundsSummary> {
  await connectDB();

  const [refunds, agg] = await Promise.all([
    Booking.find({ "payment.status": "refunded" })
      .populate("room", "name slug")
      .sort({ "payment.refundedAt": -1 })
      .lean(),
    Booking.aggregate<{ total: number }>([
      { $match: { "payment.status": "refunded" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return {
    refunds: serialize(refunds) as unknown as PopulatedBookingDTO[],
    totalRefunded: agg[0]?.total ?? 0,
  };
}
