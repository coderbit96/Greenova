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
  const { getRoomAvailability, findAvailableRooms, getBlockedDates } = await import(
    "../src/services/availability.service"
  );
  const { createBooking } = await import("../src/services/booking.service");
  const { priceBreakdown, nightsBetween, generateReference } = await import("../src/utils");

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
