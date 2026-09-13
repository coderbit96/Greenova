import mongoose, { Schema, model, models, type Model } from "mongoose";

export const ROOM_CATEGORIES = [
  "Deluxe Room",
  "Premium Room",
  "Executive Room",
  "Family Room",
  "Suite",
  "Luxury Suite",
] as const;

export type RoomCategory = (typeof ROOM_CATEGORIES)[number];

export interface IRoomImage {
  url: string;
  publicId?: string;
  alt?: string;
}

/** One physical room of this type. */
export interface IRoomUnit {
  roomNumber: string;
  floor: string;
  /** Out-of-service units still exist but cannot be sold. */
  status: "available" | "maintenance" | "closed";
}

export interface IAdditionalFee {
  label: string;
  /** Paise. Charged once per stay, not per night. */
  amount: number;
}

export interface IRoom {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  category: RoomCategory;
  shortDescription: string;
  description: string;

  /** Card image. Falls back to the first gallery image when unset. */
  thumbnail?: IRoomImage;
  images: IRoomImage[];

  /** Nightly rate in paise, to avoid float drift. */
  pricePerNight: number;
  /** When set and below pricePerNight, this is what the guest is charged. */
  discountedPrice?: number;

  capacity: { adults: number; children: number };
  bedType: string;
  sizeSqft: number;

  /**
   * Physical rooms of this type. `totalUnits` is kept in sync with the
   * sellable count so the availability engine can keep counting against a
   * single number.
   */
  units: IRoomUnit[];
  totalUnits: number;

  amenities: string[];
  features: string[];

  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;

  /** Overrides the global GST rate when set. */
  taxRatePercent?: number;
  additionalFees: IAdditionalFee[];

  featured: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;

  /** Internal short-lived mutex used while a reservation is being created. */
  reservationLock?: { token: string; expiresAt: Date };

  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IRoomImage>(
  {
    url: { type: String, required: true },
    publicId: String,
    alt: String,
  },
  { _id: false },
);

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    category: {
      type: String,
      enum: ROOM_CATEGORIES,
      required: true,
      default: "Deluxe Room",
      index: true,
    },
    shortDescription: { type: String, required: true, maxlength: 300 },
    description: { type: String, required: true },

    thumbnail: { type: ImageSchema, default: undefined },
    images: { type: [ImageSchema], default: [] },

    pricePerNight: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0, default: undefined },

    capacity: {
      adults: { type: Number, required: true, min: 1, default: 2 },
      children: { type: Number, required: true, min: 0, default: 0 },
    },
    bedType: { type: String, required: true, default: "King" },
    sizeSqft: { type: Number, required: true, min: 0, default: 300 },

    units: {
      type: [
        new Schema<IRoomUnit>(
          {
            roomNumber: { type: String, required: true, trim: true },
            floor: { type: String, required: true, trim: true, default: "Ground" },
            status: {
              type: String,
              enum: ["available", "maintenance", "closed"],
              default: "available",
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    // Zero is valid when every physical unit is in maintenance or closed.
    totalUnits: { type: Number, required: true, min: 0, default: 1 },

    amenities: { type: [String], default: [] },
    features: { type: [String], default: [] },

    cancellationPolicy: {
      type: String,
      required: true,
      default: "Free cancellation up to 48 hours before arrival.",
      maxlength: 500,
    },
    checkInTime: { type: String, required: true, default: "2:00 PM" },
    checkOutTime: { type: String, required: true, default: "11:00 AM" },

    taxRatePercent: { type: Number, min: 0, max: 100, default: undefined },
    additionalFees: {
      type: [
        new Schema<IAdditionalFee>(
          {
            label: { type: String, required: true, trim: true },
            amount: { type: Number, required: true, min: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    /** Drives the "Most Popular" sort. */
    bookingCount: { type: Number, default: 0, min: 0, index: true },
    // A conditional update of this field serializes booking creation for one
    // room type. It is not part of any room DTO or API response.
    reservationLock: {
      token: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
  },
  { timestamps: true },
);

/**
 * Inventory is counted from `units` when they are defined, so a unit put into
 * maintenance stops being sellable without anyone editing `totalUnits` by hand.
 * Rooms that predate per-unit tracking keep whatever `totalUnits` they had.
 */
RoomSchema.pre("save", function syncTotalUnits() {
  // Mongoose 9 save hooks receive SaveOptions, not a `next` callback; the
  // hook completes by returning.
  if (this.units?.length) {
    this.totalUnits = this.units.filter((u) => u.status === "available").length;
  }
});

RoomSchema.index({ pricePerNight: 1 });
RoomSchema.index({ "capacity.adults": 1 });
RoomSchema.index({ category: 1, active: 1 });

const Room: Model<IRoom> = models.Room || model<IRoom>("Room", RoomSchema);
export default Room;
