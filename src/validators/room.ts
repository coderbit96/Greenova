import { z } from "zod";
import { ROOM_CATEGORIES } from "@/types/models";

/**
 * Admin room form. Prices are entered in rupees and converted to paise in
 * the service layer, so `RoomInput` (form) and `RoomOutput` (parsed) differ
 * where `z.coerce` is involved.
 */
export const roomSchema = z.object({
  name: z.string().min(2).max(140),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  description: z.string().min(20, "Description is too short"),
  shortDescription: z.string().min(10).max(300),
  category: z.enum(ROOM_CATEGORIES).default("Deluxe Room"),
  pricePerNight: z.coerce.number().min(1, "Price is required"),
  // Optional; the form sends "" when cleared.
  discountedPrice: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : Number(v))),
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20),
  bedType: z.string().min(1),
  sizeSqft: z.coerce.number().min(1),
  totalUnits: z.coerce.number().int().min(0).max(500),
  amenities: z.string().optional(),
  features: z.string().optional(),
  images: z.string().optional(),
  thumbnail: z.string().optional(),
  /** "201:2nd, 202:2nd" — number:floor pairs, comma separated. */
  units: z.string().optional(),
  cancellationPolicy: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  checkInTime: z.string().max(20).optional().or(z.literal("")).transform((v) => v || undefined),
  checkOutTime: z.string().max(20).optional().or(z.literal("")).transform((v) => v || undefined),
  taxRatePercent: z
    .union([z.coerce.number().min(0).max(100), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : Number(v))),
  /** "Cleaning:1500, Airport transfer:2500" — label:rupees pairs. */
  additionalFees: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type RoomInput = z.input<typeof roomSchema>;
export type RoomOutput = z.output<typeof roomSchema>;
