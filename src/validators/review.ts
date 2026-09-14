import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url().max(2_000),
  publicId: z.string().max(500).optional(),
});

export const submitReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().min(20, "Please write at least 20 characters.").max(2_000),
  images: z.array(imageSchema).max(5).default([]),
}).strict();

export const reviewModerationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "HIDDEN"]),
}).strict();

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;
