import { z } from "zod";

const dateString = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

export const availabilitySchema = z
  .object({
    checkIn: dateString,
    checkOut: dateString,
    adults: z.coerce.number().int().min(1).max(20).default(2),
    children: z.coerce.number().int().min(0).max(20).default(0),
    rooms: z.coerce.number().int().min(1).max(10).default(1),
  })
  .refine((d) => new Date(d.checkOut) > new Date(d.checkIn), {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

/** Guest contact details, shared by the checkout form and the booking API. */
export const guestSchema = z.object({
  guestName: z.string().min(2, "Name is required").max(120),
  guestEmail: z.email("Enter a valid email address").toLowerCase(),
  guestPhone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s()-]*$/, "Enter a valid phone number"),
  guestAddress: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
  specialRequests: z.string().max(1000).optional().or(z.literal("")),
});

export const bookingSchema = guestSchema
  .extend({
    roomId: z.string().min(1, "Room is required"),
    checkIn: dateString,
    checkOut: dateString,
    adults: z.coerce.number().int().min(1).max(20),
    children: z.coerce.number().int().min(0).max(20).default(0),
    roomsBooked: z.coerce.number().int().min(1).max(10).default(1),
    couponCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, "Invalid coupon code").optional().or(z.literal("")),
  })
  // Reject attempts to smuggle server-owned values such as price, role,
  // booking/payment state, availability, or another user's id.
  .strict()
  .refine((d) => new Date(d.checkOut) > new Date(d.checkIn), {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  bookingStatus: z.enum(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"]).optional(),
  refund: z.boolean().optional(),
  cancellationReason: z.string().max(500).optional(),
  internalNote: z.string().trim().min(1).max(1000).optional(),
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
