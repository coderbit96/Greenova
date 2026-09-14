import { z } from "zod";

const socialLinksSchema = z.record(z.string().max(40), z.string().url().max(2_000));

const hotelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  logo: z.string().url().max(2_000).optional().or(z.literal("")),
  email: z.email().toLowerCase(),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(500),
  mapsLink: z.string().url().max(2_000).optional().or(z.literal("")),
  timezone: z.string().trim().min(2).max(100),
  currency: z.string().trim().length(3).toUpperCase(),
  socialLinks: socialLinksSchema.default({}),
});

const bookingSchema = z.object({
  checkIn: z.string().trim().min(2).max(40),
  checkOut: z.string().trim().min(2).max(40),
  maxAdvanceDays: z.coerce.number().int().min(1).max(730),
  minimumStayNights: z.coerce.number().int().min(1).max(30),
  cancellationRules: z.string().trim().min(10).max(4_000),
});

const taxSchema = z.object({
  taxPercent: z.coerce.number().min(0).max(100),
  serviceChargePercent: z.coerce.number().min(0).max(100),
});

const contentSchema = z.object({
  homeHeroTitle: z.string().trim().max(240).optional().or(z.literal("")),
  homeHeroSubtitle: z.string().trim().max(800).optional().or(z.literal("")),
  about: z.string().trim().max(10_000).optional().or(z.literal("")),
  faqs: z.array(z.object({
    question: z.string().trim().min(4).max(300),
    answer: z.string().trim().min(10).max(2_000),
  })).max(30).default([]),
});

/** Only these non-secret, business-facing settings may be changed by admins. */
export const hotelSettingsUpdateSchema = z.object({
  hotel: hotelSchema.optional(),
  booking: bookingSchema.optional(),
  tax: taxSchema.optional(),
  payment: z.object({ razorpayEnabled: z.boolean() }).optional(),
  content: contentSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, "No settings supplied");

export type HotelSettingsUpdateInput = z.infer<typeof hotelSettingsUpdateSchema>;
