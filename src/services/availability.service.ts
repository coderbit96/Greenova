import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking, { type IBooking } from "@/models/Booking";
import Room from "@/models/Room";
import { toUTCDay } from "@/utils";

/**
 * Availability engine — the single source of truth for what can be booked.
 *
 * Statuses that occupy inventory. Cancelled bookings free their unit;
 * pending ones hold it so two people can't check out on the same room
 * while the first payment is still in flight.
 */
export const BLOCKING_STATUSES = ["pending", "confirmed", "completed"] as const;

/** Pending payment holds expire; confirmed and completed stays always block. */
function activeInventoryState(now = new Date()): mongoose.QueryFilter<IBooking> {
  return {
    $or: [
      { status: { $in: ["confirmed", "completed"] } },
      {
        status: "pending",
        $or: [
          { paymentHoldExpiresAt: { $gt: now } },
          // Existing bookings created before holds were introduced remain valid.
          { paymentHoldExpiresAt: { $exists: false } },
        ],
      },
    ],
  };
}

/**
 * Two half-open intervals [aIn, aOut) and [bIn, bOut) overlap iff
 * aIn < bOut && aOut > bIn. Using half-open ranges means a guest checking
 * out on the 5th and another checking in on the 5th do NOT conflict.
 */
export function datesOverlap(aIn: Date, aOut: Date, bIn: Date, bOut: Date): boolean {
  return aIn < bOut && aOut > bIn;
}

/** Units of a room already committed for any part of the range. */
/**
 * `Model.aggregate()` performs no schema casting, unlike `find()`. Route
 * handlers pass ids as strings, so they must be converted explicitly or the
 * `$match` silently matches nothing.
 */
function toObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId | null {
  if (id instanceof mongoose.Types.ObjectId) return id;
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null;
}

export async function bookedUnits(
  roomId: string | mongoose.Types.ObjectId,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<number> {
  await connectDB();

  const room = toObjectId(roomId);
  // An unparseable id cannot match any booking; treat it as nothing booked
  // rather than letting an uncast string match nothing silently.
  if (!room) return 0;

  const query: mongoose.QueryFilter<IBooking> = {
    room,
    status: { $in: BLOCKING_STATUSES },
    ...activeInventoryState(),
    checkIn: { $lt: toUTCDay(checkOut) },
    checkOut: { $gt: toUTCDay(checkIn) },
  };
  if (excludeBookingId && mongoose.isValidObjectId(excludeBookingId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }
  const [result] = await Booking.aggregate<{ taken: number }>([
    { $match: query },
    // Legacy bookings did not have roomsBooked, so they continue to occupy
    // one unit while new bookings can reserve multiple units atomically.
    { $group: { _id: null, taken: { $sum: { $ifNull: ["$roomsBooked", 1] } } } },
  ]);
  return result?.taken ?? 0;
}

export async function getRoomAvailability(
  roomId: string | mongoose.Types.ObjectId,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
  unitsWanted = 1,
): Promise<{ available: boolean; unitsLeft: number; totalUnits: number }> {
  await connectDB();

  // A malformed id from a query string must read as unavailable, not throw:
  // Room.findById casts strictly and would surface a 500 to the caller.
  if (!toObjectId(roomId)) return { available: false, unitsLeft: 0, totalUnits: 0 };

  const room = await Room.findById(roomId).select("totalUnits active").lean();
  if (!room || !room.active) return { available: false, unitsLeft: 0, totalUnits: 0 };

  const taken = await bookedUnits(roomId, checkIn, checkOut, excludeBookingId);
  const unitsLeft = Math.max(0, room.totalUnits - taken);
  return { available: unitsLeft >= unitsWanted, unitsLeft, totalUnits: room.totalUnits };
}

export interface AvailabilityFilters {
  checkIn: Date;
  checkOut: Date;
  adults?: number;
  children?: number;
  /** How many units of the same room type are needed. */
  rooms?: number;
}

/**
 * Returns every active room annotated with how many units remain for the
 * given range. One aggregation instead of N queries.
 */
export async function findAvailableRooms(filters: AvailabilityFilters) {
  await connectDB();
  const { checkIn, checkOut, adults = 1, children = 0, rooms: unitsWanted = 1 } = filters;
  const inDay = toUTCDay(checkIn);
  const outDay = toUTCDay(checkOut);

  const rooms = await Room.find({
    active: true,
    "capacity.adults": { $gte: adults },
    "capacity.children": { $gte: children },
  })
    .sort({ featured: -1, pricePerNight: 1 })
    .lean();

  if (rooms.length === 0) return [];

  const counts = await Booking.aggregate<{ _id: mongoose.Types.ObjectId; taken: number }>([
    {
      $match: {
        room: { $in: rooms.map((r) => r._id) },
        status: { $in: [...BLOCKING_STATUSES] },
        ...activeInventoryState(),
        checkIn: { $lt: outDay },
        checkOut: { $gt: inDay },
      },
    },
    { $group: { _id: "$room", taken: { $sum: { $ifNull: ["$roomsBooked", 1] } } } },
  ]);

  const takenByRoom = new Map(counts.map((c) => [String(c._id), c.taken]));

  return rooms.map((room) => {
    const taken = takenByRoom.get(String(room._id)) ?? 0;
    const unitsLeft = Math.max(0, room.totalUnits - taken);
    // Asking for 3 rooms means three units of this type must be free.
    return { ...room, unitsLeft, available: unitsLeft >= unitsWanted };
  });
}

/** Dates in the next `days` window where a room is fully sold out. */
export async function getBlockedDates(
  roomId: string | mongoose.Types.ObjectId,
  days = 180,
): Promise<string[]> {
  await connectDB();
  const room = await Room.findById(roomId).select("totalUnits").lean();
  if (!room) return [];

  const from = toUTCDay(new Date());
  const to = new Date(from.getTime() + days * 86_400_000);

  const bookings = await Booking.find({
    room: toObjectId(roomId) ?? roomId,
    status: { $in: BLOCKING_STATUSES },
    ...activeInventoryState(),
    checkOut: { $gt: from },
    checkIn: { $lt: to },
  })
    .select("checkIn checkOut roomsBooked")
    .lean();

  // Tally occupancy per night, then keep the nights at full capacity.
  const tally = new Map<string, number>();
  for (const b of bookings) {
    const start = Math.max(toUTCDay(b.checkIn).getTime(), from.getTime());
    const end = Math.min(toUTCDay(b.checkOut).getTime(), to.getTime());
    for (let t = start; t < end; t += 86_400_000) {
      const key = new Date(t).toISOString().slice(0, 10);
      tally.set(key, (tally.get(key) ?? 0) + (b.roomsBooked ?? 1));
    }
  }

  return [...tally.entries()]
    .filter(([, n]) => n >= room.totalUnits)
    .map(([day]) => day)
    .sort();
}
