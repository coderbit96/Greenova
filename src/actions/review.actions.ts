"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  deleteReview,
  moderateReview,
  ReviewError,
  submitReview,
} from "@/services/review.service";
import { reviewModerationSchema, submitReviewSchema } from "@/validators/review";
import type { ReviewDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

function toError(err: unknown): ActionResult<never> {
  if (err instanceof ReviewError) return { ok: false, error: err.message };
  console.error("[review]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function submitReviewAction(input: unknown): Promise<ActionResult<ReviewDTO>> {
  try {
    const session = await requireUser();
    const parsed = submitReviewSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please add a rating and a review of at least 20 characters." };

    const review = await submitReview(session.user.id, parsed.data);
    revalidatePath("/account/bookings");
    revalidatePath(`/account/bookings/${parsed.data.bookingId}`);
    return { ok: true, data: review };
  } catch (err) {
    return toError(err);
  }
}

export async function moderateReviewAction(
  reviewId: string,
  input: unknown,
): Promise<ActionResult<ReviewDTO>> {
  try {
    const session = await requireAdmin();
    const parsed = reviewModerationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid moderation status." };

    const review = await moderateReview(reviewId, session.user.id, parsed.data);
    revalidatePath("/admin/reviews");
    revalidatePath("/rooms");
    return { ok: true, data: review };
  } catch (err) {
    return toError(err);
  }
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult<null>> {
  try {
    await requireAdmin();
    await deleteReview(reviewId);
    revalidatePath("/admin/reviews");
    revalidatePath("/rooms");
    return { ok: true, data: null };
  } catch (err) {
    return toError(err);
  }
}
