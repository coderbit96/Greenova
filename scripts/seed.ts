/**
 * Seeds Greenova with rooms, demo accounts and sample bookings.
 *
 *   npm run seed
 *
 * Safe to re-run: it clears the collections it owns before inserting.
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Room from "../src/models/Room";
import User from "../src/models/User";
import Booking from "../src/models/Booking";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("\n  MONGODB_URI is not set. Copy .env.example to .env first.\n");
  process.exit(1);
}

/** Prices are in paise. */
const rooms = [
  {
    name: "Canopy Suite",
    slug: "canopy-suite",
    category: "Luxury Suite",
    shortDescription:
      "A corner suite on the highest terrace, with a wraparound veranda that puts you level with the hornbills.",
    description: `The Canopy Suite sits at the top of the estate, where the tree line drops away and the valley opens out beneath you. The veranda wraps two sides, wide enough for a daybed and a dining table, and it is where most guests end up spending their afternoons.

Inside, the room is timber and lime plaster, with a bed positioned so that the first thing you see on waking is the ridge opposite. The bathroom opens to a private outdoor shower screened by cardamom.

Mornings begin with coffee grown four hundred metres from your door, brought up whenever you ask for it.`,
    pricePerNight: 2_400_000,
    capacity: { adults: 2, children: 1 },
    bedType: "King",
    sizeSqft: 720,
    totalUnits: 4,
    features: ["Valley-facing", "Wraparound veranda", "Outdoor shower", "Espresso machine"],
    units: [
      { roomNumber: "401", floor: "4th" },
      { roomNumber: "402", floor: "4th" },
      { roomNumber: "403", floor: "4th" },
      { roomNumber: "404", floor: "4th" },
    ],
    additionalFees: [{ label: "Airport transfer", amount: 450_000 }],
    amenities: [
      "Wraparound private veranda",
      "Outdoor rain shower",
      "Estate coffee service",
      "Handmade organic toiletries",
      "Air conditioning & ceiling fan",
      "Complimentary minibar",
      "Fibre Wi-Fi",
      "In-room safe",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop", alt: "Canopy Suite bedroom" },
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop", alt: "Suite living area" },
      { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1600&auto=format&fit=crop", alt: "Bathroom" },
      { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop", alt: "Veranda view" },
      { url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1600&auto=format&fit=crop", alt: "Suite detail" },
    ],
    featured: true,
    active: true,
    rating: 4.9,
    reviewCount: 128,
    bookingCount: 128,
  },
  {
    name: "Valley Villa",
    slug: "valley-villa",
    category: "Suite",
    shortDescription:
      "A two-bedroom villa with its own plunge pool, set apart from the main house at the end of the eastern path.",
    description: `The largest accommodation on the estate, and the most private. The Valley Villa sits alone at the end of the eastern path, ten minutes' walk from the main house and entirely out of sight of it.

Two bedrooms open onto a shared deck with a heated plunge pool cut into the rock. There is a full kitchen, though most guests never use it — the estate kitchen will send anything down at any hour.

Best suited to families or two couples travelling together.`,
    pricePerNight: 4_200_000,
    capacity: { adults: 4, children: 2 },
    bedType: "Two Kings",
    sizeSqft: 1450,
    totalUnits: 2,
    discountedPrice: 3_570_000,
    features: ["Private plunge pool", "Two bedrooms", "Full kitchen", "Fire pit"],
    units: [
      { roomNumber: "V1", floor: "Ground" },
      { roomNumber: "V2", floor: "Ground" },
    ],
    additionalFees: [{ label: "Cleaning", amount: 250_000 }],
    amenities: [
      "Private heated plunge pool",
      "Two en-suite bedrooms",
      "Full kitchen & dining",
      "Outdoor fire pit",
      "Private path & gate",
      "Butler service on request",
      "Fibre Wi-Fi",
      "Washer & dryer",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop", alt: "Valley Villa exterior" },
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop", alt: "Villa bedroom" },
      { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop", alt: "Plunge pool" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop", alt: "Living space" },
    ],
    featured: true,
    active: true,
    rating: 5.0,
    reviewCount: 64,
    bookingCount: 64,
  },
  {
    name: "Forest Loft",
    slug: "forest-loft",
    category: "Executive Room",
    shortDescription:
      "A split-level room built into the slope, with a reading mezzanine and a bath that looks straight into the trees.",
    description: `Built into the hillside rather than onto it, the Forest Loft is entered at the upper level and opens downward. The mezzanine holds a desk and a reading chair; the lower floor holds the bed and a freestanding bath positioned in front of a full-height window.

The window faces due east into dense canopy, which means the room fills with green light from about six in the morning. There are blackout curtains for those who would rather it did not.

A favourite with writers and solo travellers.`,
    pricePerNight: 1_600_000,
    capacity: { adults: 2, children: 0 },
    bedType: "Queen",
    sizeSqft: 480,
    totalUnits: 6,
    features: ["Split level", "Reading mezzanine", "Forest-facing bath", "Writing desk"],
    units: [
      { roomNumber: "301", floor: "3rd" },
      { roomNumber: "302", floor: "3rd" },
      { roomNumber: "303", floor: "3rd" },
      { roomNumber: "304", floor: "3rd" },
      { roomNumber: "305", floor: "3rd" },
      { roomNumber: "306", floor: "3rd" },
    ],
    additionalFees: [],
    amenities: [
      "Reading mezzanine",
      "Freestanding forest-facing bath",
      "Writing desk",
      "Blackout curtains",
      "Espresso machine",
      "Fibre Wi-Fi",
      "Air conditioning",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600&auto=format&fit=crop", alt: "Forest Loft interior" },
      { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop", alt: "Loft bedroom" },
      { url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1600&auto=format&fit=crop", alt: "Bath by the window" },
    ],
    featured: false,
    active: true,
    rating: 4.8,
    reviewCount: 203,
    bookingCount: 203,
  },
  {
    name: "Garden Room",
    slug: "garden-room",
    category: "Deluxe Room",
    shortDescription:
      "Ground-floor rooms opening directly onto the kitchen garden, a short walk from the restaurant and spa.",
    description: `The Garden Rooms sit along the lower terrace, each with french doors opening straight onto the kitchen garden. Step out in the morning and you are among the herbs that will be on your plate that evening.

These are the most straightforward rooms on the estate and the easiest to reach — level ground the whole way to the restaurant, the spa and the pool, with no steps at all.

Chosen most often by guests staying a single night, and by anyone who would rather not tackle the hill.`,
    pricePerNight: 1_100_000,
    capacity: { adults: 2, children: 2 },
    bedType: "Queen",
    sizeSqft: 380,
    totalUnits: 8,
    discountedPrice: 935_000,
    features: ["Step-free access", "Garden doors", "Walk-in shower"],
    units: [
      { roomNumber: "101", floor: "Ground" },
      { roomNumber: "102", floor: "Ground" },
      { roomNumber: "103", floor: "Ground" },
      { roomNumber: "104", floor: "Ground" },
      { roomNumber: "105", floor: "Ground" },
      { roomNumber: "106", floor: "Ground" },
      { roomNumber: "107", floor: "Ground" },
      { roomNumber: "108", floor: "Ground" },
    ],
    additionalFees: [],
    amenities: [
      "Direct garden access",
      "Step-free throughout",
      "Walk-in rain shower",
      "Tea & coffee station",
      "Fibre Wi-Fi",
      "Air conditioning",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1600&auto=format&fit=crop", alt: "Garden Room" },
      { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop", alt: "Garden Room interior" },
      { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop", alt: "Room detail" },
    ],
    featured: false,
    active: true,
    rating: 4.7,
    reviewCount: 341,
    bookingCount: 341,
  },
  {
    name: "Spring Pavilion",
    slug: "spring-pavilion",
    category: "Luxury Suite",
    shortDescription:
      "A single standalone pavilion beside the spring itself, with an open-air bathroom and no neighbours in any direction.",
    description: `There is exactly one Spring Pavilion, and it is the quietest place on the estate. It stands alone beside the spring that feeds the spa, far enough from everything else that the only sound is water.

The bathroom is open to the sky, walled in stone and screened by tree ferns. The bed faces the water. There is no television, and the Wi-Fi, while present, is not advertised.

Booked most often for anniversaries, and occasionally by people who simply need to disappear for a while.`,
    pricePerNight: 3_100_000,
    capacity: { adults: 2, children: 0 },
    bedType: "King",
    sizeSqft: 640,
    totalUnits: 1,
    features: ["Complete seclusion", "Open-air bathroom", "Spring-fed tub", "Private deck"],
    units: [{ roomNumber: "P1", floor: "Ground" }],
    additionalFees: [{ label: "Private chef", amount: 600_000 }],
    amenities: [
      "Complete seclusion",
      "Open-air stone bathroom",
      "Spring-fed soaking tub",
      "Private dining deck",
      "Outdoor fire pit",
      "Turndown with estate honey",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1600&auto=format&fit=crop", alt: "Spring Pavilion" },
      { url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1600&auto=format&fit=crop", alt: "Pavilion bedroom" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1600&auto=format&fit=crop", alt: "Open-air bathroom" },
    ],
    featured: true,
    active: true,
    rating: 5.0,
    reviewCount: 47,
    bookingCount: 47,
  },
  {
    name: "Estate Twin",
    slug: "estate-twin",
    category: "Family Room",
    shortDescription:
      "Two full beds in a bright room above the old drying yard, built for friends travelling together.",
    description: `Above the old coffee drying yard, the Estate Twin is a bright, high-ceilinged room with two full beds and a shared veranda looking west over the terraces.

It gets the evening light, which makes it the best room on the estate for watching the sun go down without leaving your chair.

Priced for friends travelling together rather than couples, and popular with the trekking groups who come through in season.`,
    pricePerNight: 1_300_000,
    capacity: { adults: 2, children: 1 },
    bedType: "Two Doubles",
    sizeSqft: 420,
    totalUnits: 3,
    features: ["Two full beds", "West-facing veranda", "Evening light"],
    units: [
      { roomNumber: "201", floor: "2nd" },
      { roomNumber: "202", floor: "2nd" },
      { roomNumber: "203", floor: "2nd" },
    ],
    additionalFees: [],
    amenities: [
      "Two full beds",
      "West-facing veranda",
      "Evening light",
      "Tea & coffee station",
      "Fibre Wi-Fi",
      "Ceiling fan",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1600&auto=format&fit=crop", alt: "Estate Twin room" },
      { url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1600&auto=format&fit=crop", alt: "Twin beds" },
    ],
    featured: false,
    active: true,
    rating: 4.6,
    reviewCount: 89,
    bookingCount: 89,
  },
];

function day(offset: number): Date {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Date(utc.getTime() + offset * 86_400_000);
}

function reference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `GRN-${out}`;
}

async function seed() {
  console.log("\n  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI!);
  console.log("  Connected.\n");

  console.log("  Clearing existing data…");
  await Promise.all([
    Room.deleteMany({}),
    User.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  console.log("  Creating rooms…");
  const createdRooms = await Room.insertMany(rooms);
  console.log(`    ${createdRooms.length} rooms created.`);

  console.log("  Creating users…");
  const [adminHash, guestHash] = await Promise.all([
    bcrypt.hash("Admin@1234", 12),
    bcrypt.hash("Guest@1234", 12),
  ]);

  await User.create({
    name: "Priya Nair",
    email: "admin@greenova.com",
    passwordHash: adminHash,
    role: "admin",
    provider: "credentials",
    emailVerified: new Date(),
  });

  const guest = await User.create({
    name: "Arjun Menon",
    email: "guest@greenova.com",
    passwordHash: guestHash,
    role: "customer",
    provider: "credentials",
    emailVerified: new Date(),
  });

  console.log("    2 users created.");

  console.log("  Creating sample bookings…");
  const TAX_RATE = 0.12;

  const samples = [
    // A past, completed stay.
    { room: createdRooms[0], checkIn: day(-40), checkOut: day(-36), status: "completed", payment: "paid" },
    // A confirmed upcoming stay.
    { room: createdRooms[2], checkIn: day(14), checkOut: day(17), status: "confirmed", payment: "paid" },
    // One awaiting payment.
    { room: createdRooms[3], checkIn: day(30), checkOut: day(32), status: "pending", payment: "pending" },
    // A cancelled one, so the admin view has all states.
    { room: createdRooms[1], checkIn: day(50), checkOut: day(54), status: "cancelled", payment: "refunded" },
    // Recent paid bookings so the revenue chart has a shape.
    { room: createdRooms[4], checkIn: day(-8), checkOut: day(-5), status: "completed", payment: "paid" },
    { room: createdRooms[5], checkIn: day(-3), checkOut: day(-1), status: "completed", payment: "paid" },
    { room: createdRooms[0], checkIn: day(7), checkOut: day(10), status: "confirmed", payment: "paid" },
  ];

  const bookings = samples.map((s, i) => {
    const nights = Math.round((s.checkOut.getTime() - s.checkIn.getTime()) / 86_400_000);
    const roomTotal = s.room.pricePerNight * nights;
    const taxes = Math.round(roomTotal * TAX_RATE);
    const paid = s.payment === "paid" || s.payment === "refunded";

    return {
      reference: reference(),
      user: guest._id,
      room: s.room._id,
      guest: { name: guest.name, email: guest.email, phone: "+91 98450 11223" },
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      nights,
      guests: { adults: 2, children: 0 },
      roomTotal,
      taxes,
      totalAmount: roomTotal + taxes,
      status: s.status,
      specialRequests: i === 1 ? "Arriving late, around 11pm. A light supper would be welcome." : undefined,
      payment: {
        status: s.payment,
        provider: "mock",
        orderId: paid ? `mock_order_seed_${i}` : undefined,
        paymentId: paid ? `mock_pay_seed_${i}` : undefined,
        // Spread payment dates across the last few weeks for the chart.
        paidAt: paid ? day(-Math.floor(Math.random() * 25) - 1) : undefined,
        refundedAt: s.payment === "refunded" ? day(-2) : undefined,
      },
      cancelledAt: s.status === "cancelled" ? day(-2) : undefined,
      cancellationReason: s.status === "cancelled" ? "Change of plans" : undefined,
    };
  });

  await Booking.insertMany(bookings);
  console.log(`    ${bookings.length} bookings created.`);

  console.log(`
  ─────────────────────────────────────────────
   Seed complete.

   Admin    admin@greenova.com  /  Admin@1234
   Guest    guest@greenova.com  /  Guest@1234

   Start the app with:  npm run dev
  ─────────────────────────────────────────────
`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("\n  Seed failed:\n", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
