import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import Booking from "@/models/Booking";
import { serialize, rupeesToPaise } from "@/utils";
import type { RoomDTO, RoomCategory } from "@/types/models";
import type { RoomOutput } from "@/validators/room";

/**
 * Room data access. Pages and API routes both call these, so the queries
 * and the paise conversion live in exactly one place.
 */

export type RoomSort = "recommended" | "price-asc" | "price-desc" | "popular";

export interface RoomListFilters {
  category?: string;
  /** Rupees at the boundary; converted to paise here. */
  minPrice?: number;
  maxPrice?: number;
  adults?: number;
  children?: number;
  amenities?: string[];
  sort?: RoomSort;
}

const SORTS: Record<RoomSort, Record<string, 1 | -1>> = {
  recommended: { featured: -1, rating: -1, pricePerNight: 1 },
  "price-asc": { pricePerNight: 1 },
  "price-desc": { pricePerNight: -1 },
  popular: { bookingCount: -1, reviewCount: -1 },
};

export async function listActiveRooms(
  filters: RoomListFilters = {},
): Promise<RoomDTO[]> {
  await connectDB();

  const query: Record<string, unknown> = { active: true };

  if (filters.category) query.category = filters.category;
  if (filters.adults) query["capacity.adults"] = { $gte: filters.adults };
  if (filters.children) query["capacity.children"] = { $gte: filters.children };
  if (filters.amenities?.length) query.amenities = { $all: filters.amenities };

  // Price filters compare against the rate actually charged, so a discounted
  // room shows up under its sale price rather than its list price.
  if (filters.minPrice != null || filters.maxPrice != null) {
    const bounds: Record<string, number> = {};
    if (filters.minPrice != null) bounds.$gte = rupeesToPaise(filters.minPrice);
    if (filters.maxPrice != null) bounds.$lte = rupeesToPaise(filters.maxPrice);
    query.$expr = {
      $and: [
        ...(bounds.$gte != null
          ? [{ $gte: [{ $ifNull: ["$discountedPrice", "$pricePerNight"] }, bounds.$gte] }]
          : []),
        ...(bounds.$lte != null
          ? [{ $lte: [{ $ifNull: ["$discountedPrice", "$pricePerNight"] }, bounds.$lte] }]
          : []),
      ],
    };
  }

  const rooms = await Room.find(query)
    .sort(SORTS[filters.sort ?? "recommended"])
    .lean();

  return serialize(rooms) as unknown as RoomDTO[];
}

/** Distinct categories that currently have live rooms, for the filter bar. */
export async function listRoomCategories(): Promise<string[]> {
  await connectDB();
  return Room.distinct("category", { active: true });
}

export async function listFeaturedRooms(limit = 3): Promise<RoomDTO[]> {
  await connectDB();
  const rooms = await Room.find({ active: true })
    .sort({ featured: -1, pricePerNight: 1 })
    .limit(limit)
    .lean();
  return serialize(rooms) as unknown as RoomDTO[];
}

/** Every room including hidden ones — admin only. */
/**
 * Rooms to show alongside one being viewed: same category first, then any
 * other live room, so a single-room category still fills the strip.
 */
export async function listRelatedRooms(
  slug: string,
  category: RoomCategory,
  limit = 3,
): Promise<RoomDTO[]> {
  await connectDB();

  const sameCategory = await Room.find({ active: true, slug: { $ne: slug }, category })
    .sort({ featured: -1, rating: -1 })
    .limit(limit)
    .lean();

  if (sameCategory.length >= limit) {
    return serialize(sameCategory) as unknown as RoomDTO[];
  }

  const fill = await Room.find({
    active: true,
    slug: { $ne: slug },
    _id: { $nin: sameCategory.map((r) => r._id) },
  })
    .sort({ featured: -1, rating: -1 })
    .limit(limit - sameCategory.length)
    .lean();

  return serialize([...sameCategory, ...fill]) as unknown as RoomDTO[];
}

export async function listAllRooms(): Promise<RoomDTO[]> {
  await connectDB();
  const rooms = await Room.find({}).sort({ createdAt: -1 }).lean();
  return serialize(rooms) as unknown as RoomDTO[];
}

export async function getRoomBySlug(slug: string): Promise<RoomDTO | null> {
  await connectDB();
  const room = await Room.findOne({ slug, active: true }).lean();
  return room ? (serialize(room) as unknown as RoomDTO) : null;
}

export async function getRoomById(id: string): Promise<RoomDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const room = await Room.findById(id).lean();
  return room ? (serialize(room) as unknown as RoomDTO) : null;
}

/** Splits the comma-separated admin form fields into stored arrays. */
function parseList(value?: string): string[] {
  return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

/** "201:2nd, 202:2nd" -> physical units. Floor defaults when omitted. */
function parseUnits(value?: string) {
  return parseList(value).map((entry) => {
    const [roomNumber, floor] = entry.split(":").map((p) => p.trim());
    return {
      roomNumber,
      floor: floor || "Ground",
      status: "available" as const,
    };
  });
}

/** "Cleaning:1500, Transfer:2500" -> fees, rupees converted to paise. */
function parseFees(value?: string) {
  return parseList(value)
    .map((entry) => {
      const [label, amount] = entry.split(":").map((p) => p.trim());
      return { label, amount: rupeesToPaise(Number(amount) || 0) };
    })
    .filter((f) => f.label && f.amount > 0);
}

export async function createRoom(data: RoomOutput): Promise<RoomDTO> {
  await connectDB();

  const existing = await Room.findOne({ slug: data.slug });
  if (existing) throw new Error("A room with that slug already exists.");

  const room = await Room.create({
    name: data.name,
    slug: data.slug,
    description: data.description,
    shortDescription: data.shortDescription,
    // The form collects rupees; storage is always paise.
    category: data.category,
    pricePerNight: rupeesToPaise(data.pricePerNight),
    discountedPrice:
      data.discountedPrice != null ? rupeesToPaise(data.discountedPrice) : undefined,
    capacity: { adults: data.adults, children: data.children },
    bedType: data.bedType,
    sizeSqft: data.sizeSqft,
    units: parseUnits(data.units),
    totalUnits: data.totalUnits,
    amenities: parseList(data.amenities),
    features: parseList(data.features),
    thumbnail: data.thumbnail ? { url: data.thumbnail } : undefined,
    images: parseList(data.images).map((url) => ({ url })),
    cancellationPolicy: data.cancellationPolicy,
    checkInTime: data.checkInTime,
    checkOutTime: data.checkOutTime,
    taxRatePercent: data.taxRatePercent,
    additionalFees: parseFees(data.additionalFees),
    featured: data.featured,
    active: data.active,
  });

  return serialize(room.toObject()) as unknown as RoomDTO;
}

export async function updateRoom(
  id: string,
  data: Partial<RoomOutput>,
): Promise<RoomDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();

  if (data.slug) {
    const clash = await Room.findOne({ slug: data.slug, _id: { $ne: id } });
    if (clash) throw new Error("Another room already uses that slug.");
  }

  const update: Record<string, unknown> = {};
  for (const key of [
    "name", "slug", "description", "shortDescription", "category",
    "bedType", "sizeSqft", "totalUnits", "featured", "active",
    "cancellationPolicy", "checkInTime", "checkOutTime", "taxRatePercent",
  ] as const) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  if (data.discountedPrice !== undefined) {
    update.discountedPrice = rupeesToPaise(data.discountedPrice);
  }
  if (data.units !== undefined) {
    // findByIdAndUpdate does not run the model's save hook, so keep the
    // sellable inventory in sync when the admin replaces physical units.
    const units = parseUnits(data.units);
    update.units = units;
    update.totalUnits = units.length;
  }
  if (data.features !== undefined) update.features = parseList(data.features);
  if (data.thumbnail !== undefined) {
    update.thumbnail = data.thumbnail ? { url: data.thumbnail } : undefined;
  }
  if (data.additionalFees !== undefined) {
    update.additionalFees = parseFees(data.additionalFees);
  }

  if (data.pricePerNight !== undefined) {
    update.pricePerNight = rupeesToPaise(data.pricePerNight);
  }

  if (data.adults !== undefined || data.children !== undefined) {
    const current = await Room.findById(id).select("capacity").lean();
    update.capacity = {
      adults: data.adults ?? current?.capacity.adults ?? 2,
      children: data.children ?? current?.capacity.children ?? 0,
    };
  }

  if (data.amenities !== undefined) update.amenities = parseList(data.amenities);
  if (data.images !== undefined) {
    update.images = parseList(data.images).map((url) => ({ url }));
  }

  const room = await Room.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  return room ? (serialize(room) as unknown as RoomDTO) : null;
}

export interface DeleteRoomResult {
  deleted: boolean;
  deactivated: boolean;
  message?: string;
}

/**
 * Deletes a room, unless it has upcoming bookings — those are deactivated
 * instead so a live reservation is never orphaned.
 */
export async function deleteRoom(id: string): Promise<DeleteRoomResult | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();

  const upcoming = await Booking.countDocuments({
    room: id,
    status: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: new Date() },
  });

  if (upcoming > 0) {
    const room = await Room.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!room) return null;
    return {
      deleted: false,
      deactivated: true,
      message: `This room has ${upcoming} upcoming booking(s), so it was hidden from the site instead of deleted.`,
    };
  }

  const room = await Room.findByIdAndDelete(id);
  if (!room) return null;
  return { deleted: true, deactivated: false };
}
