import { z } from "zod";

const date = z.coerce.date();

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, "Use 3–40 letters, numbers, _ or -"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minimumBookingAmount: z.coerce.number().int().min(0).optional(),
  maximumDiscount: z.coerce.number().int().min(0).optional(),
  startDate: date,
  expiryDate: date,
  usageLimit: z.coerce.number().int().min(1).optional(),
  perUserLimit: z.coerce.number().int().min(1).optional(),
  roomRestrictions: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(50).default([]),
  active: z.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.expiryDate <= value.startDate) ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "Expiry must be after start date." });
  if (value.type === "PERCENTAGE" && value.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Percentage cannot exceed 100." });
});

export type CouponInput = z.infer<typeof couponSchema>;
