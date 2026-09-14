/**
 * Integration checks for the booking engine, run against a real MongoDB
 * (in-memory). Exercises availability maths, double-booking prevention,
 * price integrity and payment signature verification.
 *
 *   npx tsx scripts/verify.ts
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import crypto from "crypto";

let pass = 0;
let fail = 0;

function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n         got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
}

async function main() {
  console.log("\n  Starting in-memory MongoDB…");
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("  Connected.\n");

  // Import after MONGODB_URI is set, since db.ts reads it at module load.
  const { default: Room } = await import("../src/models/Room");
  const { default: Booking } = await import("../src/models/Booking");
  const { default: User } = await import("../src/models/User");
  const { default: Coupon } = await import("../src/models/Coupon");
  const { getRoomAvailability, findAvailableRooms, getBlockedDates } = await import(
    "../src/services/availability.service"
  );
  const { createBooking } = await import("../src/services/booking.service");
  const { applyWebhookEvent } = await import("../src/services/payment.service");
  const { reserveCoupon } = await import("../src/services/coupon.service");
  const { submitReview, moderateReview, listApprovedReviews, deleteReview } = await import(
    "../src/services/review.service"
  );
  const { priceBreakdown, nightsBetween, generateReference } = await import("../src/utils");
  const { bookingSchema } = await import("../src/validators/booking");
  const { verifyPaymentSchema } = await import("../src/validators/payment");

  const day = (o: number) => {
    const n = new Date();
    const u = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
    return new Date(u + o * 86_400_000);
  };

  const user = await User.create({
    name: "Test Guest",
    email: "test@greenova.com",
    passwordHash: "x",
    role: "customer",
  });

  // A room with exactly 2 physical units.
  const room = await Room.create({
    name: "Test Suite",
    slug: "test-suite",
    description: "A test room description that is long enough.",
    shortDescription: "Short description.",
    pricePerNight: 1_000_000, // ₹10,000
    capacity: { adults: 2, children: 1 },
    bedType: "King",
    sizeSqft: 400,
    totalUnits: 2,
    amenities: ["Wi-Fi"],
    images: [{ url: "https://example.com/a.jpg" }],
    active: true,
  });

  const mkBooking = (
    checkIn: Date,
    checkOut: Date,
    status: "pending" | "confirmed" | "cancelled" | "completed" = "confirmed",
  ) => {
    const nights = nightsBetween(checkIn, checkOut);
    const { roomTotal, taxes, totalAmount } = priceBreakdown(room.pricePerNight, nights);
    return Booking.create({
      reference: generateReference(),
      user: user._id,
      room: room._id,
      guest: { name: "Test", email: "t@e.com", phone: "+911234567890" },
      checkIn,
      checkOut,
      nights,
      guests: { adults: 2, children: 0 },
      roomTotal,
      taxes,
      totalAmount,
      status,
      payment: { status: "paid", provider: "mock" },
    });
  };

  console.log("  ── Availability ──");

  let a = await getRoomAvailability(room._id, day(10), day(12));
  check("empty room: 2 units free", [a.available, a.unitsLeft], [true, 2]);

  const firstBooking = await mkBooking(day(10), day(12));
  check("canonical booking lifecycle status is separate", firstBooking.bookingStatus, "CONFIRMED");
  check("canonical payment lifecycle status is separate", firstBooking.paymentStatus, "PAID");
  check("canonical booking identifiers mirror legacy references", firstBooking.bookingId, firstBooking.reference);
  a = await getRoomAvailability(room._id, day(10), day(12));
  check("after 1 booking: 1 unit left", [a.available, a.unitsLeft], [true, 1]);

  await mkBooking(day(10), day(12));
  a = await getRoomAvailability(room._id, day(10), day(12));
  check("after 2 bookings: sold out", [a.available, a.unitsLeft], [false, 0]);

  // Back-to-back must NOT conflict (half-open intervals).
  a = await getRoomAvailability(room._id, day(12), day(14));
  check("same-day turnover is free", [a.available, a.unitsLeft], [true, 2]);

  a = await getRoomAvailability(room._id, day(8), day(10));
  check("range ending at check-in is free", [a.available, a.unitsLeft], [true, 2]);

  // Partial overlap still consumes inventory.
  a = await getRoomAvailability(room._id, day(11), day(13));
  check("partial overlap sees both bookings", [a.available, a.unitsLeft], [false, 0]);

  console.log("\n  ── Cancellation frees inventory ──");
  const toCancel = await Booking.findOne({ room: room._id });
  toCancel!.status = "cancelled";
  await toCancel!.save();
  a = await getRoomAvailability(room._id, day(10), day(12));
  check("cancelling returns a unit", [a.available, a.unitsLeft], [true, 1]);

  console.log("\n  ── Pending holds inventory ──");
  await mkBooking(day(20), day(22), "pending");
  await mkBooking(day(20), day(22), "pending");
  a = await getRoomAvailability(room._id, day(20), day(22));
  check("two pending bookings sell out the room", [a.available, a.unitsLeft], [false, 0]);

  console.log("\n  ── excludeBookingId (payment retry) ──");
  const own = await Booking.findOne({ checkIn: day(20), status: "pending" });
  a = await getRoomAvailability(room._id, day(20), day(22), String(own!._id));
  check("a booking does not block its own payment", [a.available, a.unitsLeft], [true, 1]);

  console.log("\n  Payment hold expiry");
  const expiredHold = await mkBooking(day(25), day(27), "pending");
  expiredHold.paymentHoldExpiresAt = day(-1);
  await expiredHold.save();
  a = await getRoomAvailability(room._id, day(25), day(27));
  check("an expired unpaid hold releases inventory", [a.available, a.unitsLeft], [true, 2]);

  console.log("\n  ── Capacity filtering ──");
  const forThree = await findAvailableRooms({ checkIn: day(40), checkOut: day(42), adults: 3 });
  check("room excluded when party exceeds capacity", forThree.length, 0);

  const forTwo = await findAvailableRooms({ checkIn: day(40), checkOut: day(42), adults: 2 });
  check("room returned for a party that fits", forTwo.length, 1);
  check("unitsLeft annotated on the result", forTwo[0]?.unitsLeft, 2);

  console.log("\n  â”€â”€ Inventory calculation â”€â”€");
  const deluxe = await Room.create({
    name: "Deluxe Inventory Test",
    slug: "deluxe-inventory-test",
    description: "A separate room type used to verify remaining inventory.",
    shortDescription: "Deluxe inventory calculation test room.",
    pricePerNight: 900_000,
    capacity: { adults: 2, children: 1 },
    bedType: "King",
    sizeSqft: 350,
    totalUnits: 8,
    amenities: ["Wi-Fi"],
    images: [{ url: "https://example.com/deluxe.jpg" }],
    active: true,
  });
  for (let i = 0; i < 6; i++) {
    await Booking.create({
      reference: generateReference(),
      user: user._id,
      room: deluxe._id,
      guest: { name: "Test", email: "t@e.com", phone: "+911234567890" },
      checkIn: day(60),
      checkOut: day(63),
      nights: 3,
      guests: { adults: 2, children: 0 },
      roomTotal: 2_700_000,
      taxes: 324_000,
      totalAmount: 3_024_000,
      status: "confirmed",
      payment: { status: "paid", provider: "mock" },
    });
  }
  const deluxeAvailability = await getRoomAvailability(deluxe._id, day(61), day(64));
  check("8 deluxe units minus 6 overlapping bookings leaves 2", deluxeAvailability.unitsLeft, 2);
  check("remaining units are bookable", deluxeAvailability.available, true);

  console.log("\n  Atomic reservation locking");
  const lastUnit = await Room.create({
    name: "Last Unit Test",
    slug: "last-unit-test",
    description: "A one-unit room type used to prove concurrent requests cannot oversell.",
    shortDescription: "Atomic last-unit reservation test room.",
    pricePerNight: 750_000,
    capacity: { adults: 2, children: 0 },
    bedType: "King",
    sizeSqft: 300,
    totalUnits: 1,
    amenities: ["Wi-Fi"],
    images: [{ url: "https://example.com/last-unit.jpg" }],
    active: true,
  });
  const simultaneous = await Promise.allSettled(
    Array.from({ length: 4 }, () =>
      createBooking(String(user._id), {
        roomId: String(lastUnit._id),
        checkIn: day(75).toISOString(),
        checkOut: day(77).toISOString(),
        adults: 2,
        children: 0,
        roomsBooked: 1,
        guestName: "Concurrent Guest",
        guestEmail: "concurrent@example.com",
        guestPhone: "+911234567890",
      }),
    ),
  );
  const accepted = simultaneous.filter((result) => result.status === "fulfilled");
  check("four simultaneous requests accept exactly one last-unit booking", accepted.length, 1);
  check(
    "inventory never goes negative under contention",
    await Booking.countDocuments({ room: lastUnit._id, checkIn: day(75), checkOut: day(77) }),
    1,
  );

  console.log("\n  ── API payload ownership ──");
  const bookingPayload = {
    roomId: String(room._id),
    checkIn: day(90).toISOString(),
    checkOut: day(92).toISOString(),
    adults: 2,
    children: 0,
    roomsBooked: 1,
    guestName: "Secure Guest",
    guestEmail: "secure@example.com",
    guestPhone: "+911234567890",
  };
  check(
    "booking schema rejects forged money, role, state and user values",
    bookingSchema.safeParse({
      ...bookingPayload,
      price: 1,
      discount: 999999,
      tax: 0,
      grandTotal: 1,
      availability: true,
      role: "ADMIN",
      paymentStatus: "PAID",
      bookingStatus: "CONFIRMED",
      userId: "another-user",
    }).success,
    false,
  );
  check(
    "payment verification rejects browser-supplied booking state",
    verifyPaymentSchema.safeParse({
      bookingId: String(room._id),
      razorpay_order_id: "order_test",
      razorpay_payment_id: "pay_test",
      razorpay_signature: "signature_test",
      paymentStatus: "PAID",
      userId: "another-user",
    }).success,
    false,
  );

  console.log("\n  ── Blocked dates ──");
  const blocked = await getBlockedDates(room._id);
  const d20 = day(20).toISOString().slice(0, 10);
  const d21 = day(21).toISOString().slice(0, 10);
  const d22 = day(22).toISOString().slice(0, 10);
  check("sold-out night 20 is blocked", blocked.includes(d20), true);
  check("sold-out night 21 is blocked", blocked.includes(d21), true);
  check("checkout day 22 is NOT blocked", blocked.includes(d22), false);

  console.log("\n  ── Pricing ──");
  const p = priceBreakdown(1_000_000, 3);
  check("3 nights at ₹10,000 = ₹30,000 room total", p.roomTotal, 3_000_000);
  check("12% GST on ₹30,000 = ₹3,600", p.taxes, 360_000);
  check("total = ₹33,600", p.totalAmount, 3_360_000);
  check("integer paise only (no float drift)", Number.isInteger(p.totalAmount), true);
  const multiRoomPrice = priceBreakdown(
    {
      pricePerNight: 1_000_000,
      discountedPrice: 800_000,
      additionalFees: [{ label: "Service", amount: 10_000 }],
    },
    3,
    2,
  );
  check("room subtotal multiplies nightly rate, nights and rooms", multiRoomPrice.roomSubtotal, 6_000_000);
  check("discount is applied before tax", multiRoomPrice.discountAmount, 1_200_000);
  check("multi-room grand total is server-calculated", multiRoomPrice.totalAmount, 5_387_200);

  console.log("\n  Coupon pricing and limits");
  await Coupon.create({
    code: "VERIFY10",
    type: "PERCENTAGE",
    value: 10,
    startDate: day(-1),
    expiryDate: day(30),
    usageLimit: 1,
    roomRestrictions: [room._id],
    active: true,
  } as never);
  const coupon = await reserveCoupon({
    code: "verify10",
    userId: String(user._id),
    roomId: String(room._id),
    roomAmount: 1_000_000,
  });
  check("coupon code is normalized server-side", coupon.couponCode, "VERIFY10");
  check("percentage coupon amount is calculated in paise", coupon.discountAmount, 100_000);
  const couponPrice = priceBreakdown(1_000_000, 1, 1, coupon.discountAmount);
  check("coupon discount lowers the taxable booking amount", [couponPrice.roomTotal, couponPrice.taxes, couponPrice.totalAmount], [900_000, 108_000, 1_008_000]);
  let couponLimitStatus = 0;
  try {
    await reserveCoupon({ code: "VERIFY10", userId: String(user._id), roomId: String(room._id), roomAmount: 1_000_000 });
  } catch (error) {
    couponLimitStatus = (error as { status?: number }).status ?? 0;
  }
  check("coupon usage limit is atomically enforced", couponLimitStatus, 409);

  console.log("\n  ── Payment signature ──");
  const secret = "test_secret";
  const orderId = "order_test123";
  const paymentId = "pay_test456";
  const sig = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

  const verify = (o: string, pmt: string, s: string) => {
    const expected = crypto.createHmac("sha256", secret).update(`${o}|${pmt}`).digest("hex");
    const x = Buffer.from(expected, "utf8");
    const y = Buffer.from(s, "utf8");
    if (x.length !== y.length) return false;
    return crypto.timingSafeEqual(x, y);
  };

  check("genuine signature accepted", verify(orderId, paymentId, sig), true);
  check("forged payment id rejected", verify(orderId, "pay_forged", sig), false);
  check("malformed signature rejected without throwing", verify(orderId, paymentId, "??"), false);

  console.log("\n  ── Razorpay webhook idempotency ──");
  const webhookBooking = await Booking.create({
    reference: generateReference(),
    user: user._id,
    room: room._id,
    guest: { name: "Webhook Test", email: "webhook@example.com", phone: "+911234567890" },
    checkIn: day(100),
    checkOut: day(102),
    nights: 2,
    guests: { adults: 2, children: 0 },
    roomTotal: 2_000_000,
    taxes: 240_000,
    totalAmount: 2_240_000,
    status: "pending",
    payment: { status: "pending", provider: "mock", orderId: "order_webhook_test" },
  });
  const captured = await applyWebhookEvent(
    "payment.captured",
    { payment: { id: "pay_webhook_test", order_id: "order_webhook_test" } },
    "evt_capture_once",
  );
  const duplicateCapture = await applyWebhookEvent(
    "payment.captured",
    { payment: { id: "pay_webhook_test", order_id: "order_webhook_test" } },
    "evt_capture_once",
  );
  const capturedBooking = await Booking.findById(webhookBooking._id);
  check("captured webhook confirms payment once", [captured, duplicateCapture], [true, false]);
  check(
    "captured webhook confirms the booking",
    [capturedBooking?.paymentStatus, capturedBooking?.bookingStatus],
    ["PAID", "CONFIRMED"],
  );

  const refundCreated = await applyWebhookEvent(
    "refund.created",
    { refund: { id: "rfnd_webhook_test", payment_id: "pay_webhook_test", amount: 2_240_000 } },
    "evt_refund_created_once",
  );
  const pendingRefund = await Booking.findById(webhookBooking._id);
  check("refund request stays pending until processed", [refundCreated, pendingRefund?.bookingStatus], [true, "REFUND_PENDING"]);

  const refundProcessed = await applyWebhookEvent(
    "refund.processed",
    { refund: { id: "rfnd_webhook_test", payment_id: "pay_webhook_test", amount: 2_240_000 } },
    "evt_refund_processed_once",
  );
  const refundedBooking = await Booking.findById(webhookBooking._id);
  check(
    "processed refund updates payment independently",
    [refundProcessed, refundedBooking?.paymentStatus, refundedBooking?.bookingStatus],
    [true, "REFUNDED", "REFUNDED"],
  );

  console.log("\n  ── Reviews ──");
  const reviewBooking = await mkBooking(day(-10), day(-8), "completed");
  const pendingReview = await submitReview(String(user._id), {
    bookingId: String(reviewBooking._id),
    rating: 4,
    review: "A restful and beautifully maintained stay with thoughtful, friendly service.",
    images: [],
  });
  check("only completed stays can create a pending review", pendingReview.status, "PENDING");
  check("pending reviews are absent from public results", (await listApprovedReviews(String(room._id))).length, 0);

  const approvedReview = await moderateReview(String(pendingReview._id), String(user._id), {
    status: "APPROVED",
  });
  check("admin approval marks a review approved", approvedReview.status, "APPROVED");
  const publicReviews = await listApprovedReviews(String(room._id));
  check("only approved review appears publicly", publicReviews.map((review) => review._id), [pendingReview._id]);
  const ratedRoom = await Room.findById(room._id);
  check("approved review updates room rating aggregate", [ratedRoom?.rating, ratedRoom?.reviewCount], [4, 1]);

  await moderateReview(String(pendingReview._id), String(user._id), { status: "HIDDEN" });
  check("hidden review is removed from public results", (await listApprovedReviews(String(room._id))).length, 0);
  await deleteReview(String(pendingReview._id));
  const resetRoom = await Room.findById(room._id);
  check("deleting a review refreshes room aggregates", [resetRoom?.rating, resetRoom?.reviewCount], [0, 0]);

  console.log("\n  ── Reference format ──");
  const refs = new Set(Array.from({ length: 500 }, () => generateReference()));
  check("references match GRN-XXXXXX", /^GRN-[A-Z0-9]{6}$/.test([...refs][0]), true);
  check("500 references are near-unique", refs.size > 495, true);

  console.log(`\n  ─────────────────────────────`);
  console.log(`   ${pass} passed, ${fail} failed`);
  console.log(`  ─────────────────────────────\n`);

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("\n  Verification crashed:\n", err);
  process.exit(1);
});
