import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { deleteImage } from "@/lib/cloudinary";
import Booking from "@/models/Booking";
import Review, { type ReviewStatus } from "@/models/Review";
import Room from "@/models/Room";
import { serialize } from "@/utils";
import type { ReviewDTO } from "@/types/models";
import type { ReviewModerationInput, SubmitReviewInput } from "@/validators/review";

export class ReviewError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

function isCompletedStay(booking: { status: string; bookingStatus?: string }) {
  return booking.status === "completed" || booking.bookingStatus === "CHECKED_OUT";
}

/** Confirms that a guest owns a stay which has actually been checked out. */
export async function assertReviewEligibility(bookingId: string, userId: string) {
  if (!mongoose.isValidObjectId(bookingId)) throw new ReviewError(400, "Invalid booking id.");

  await connectDB();
  const booking = await Booking.findById(bookingId).select("user room guest status bookingStatus");
  if (!booking) throw new ReviewError(404, "Booking not found.");
  if (String(booking.user) !== userId) throw new ReviewError(403, "You cannot review this stay.");
  if (!isCompletedStay(booking)) {
    throw new ReviewError(409, "Reviews open after your stay has been completed.");
  }
  return booking;
}

async function refreshRoomRating(roomId: mongoose.Types.ObjectId) {
  const [summary] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { room: roomId, status: "APPROVED" } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Room.findByIdAndUpdate(roomId, {
    rating: summary ? Math.round(summary.average * 10) / 10 : 0,
    reviewCount: summary?.count ?? 0,
  });
}

export async function submitReview(userId: string, data: SubmitReviewInput): Promise<ReviewDTO> {
  const booking = await assertReviewEligibility(data.bookingId, userId);

  // Images are issued by the authenticated upload endpoint. Do not accept an
  // arbitrary remote URL (or public id that could later delete another asset)
  // merely because a caller can invoke a server action directly.
  if (data.images.some((image) => !isReviewUpload(image))) {
    throw new ReviewError(400, "Review images must be uploaded through Greenova.");
  }

  const existing = await Review.exists({ booking: booking._id });
  if (existing) throw new ReviewError(409, "You have already reviewed this stay.");

  try {
    const review = await Review.create({
      booking: booking._id,
      user: booking.user,
      room: booking.room,
      guestName: booking.guest.name,
      rating: data.rating,
      review: data.review,
      images: data.images,
      status: "PENDING",
    });
    return serialize(review.toObject()) as unknown as ReviewDTO;
  } catch (err) {
    // The unique booking index is the final guard if two browser requests win
    // the read-before-create race.
    if (isDuplicateKeyError(err)) throw new ReviewError(409, "You have already reviewed this stay.");
    throw err;
  }
}

export async function getReviewForBooking(
  bookingId: string,
  userId: string,
): Promise<ReviewDTO | null> {
  if (!mongoose.isValidObjectId(bookingId)) return null;
  await connectDB();
  const review = await Review.findOne({ booking: bookingId, user: userId }).lean();
  return review ? (serialize(review) as unknown as ReviewDTO) : null;
}

/** Public query: moderation is enforced in Mongo, never in a component. */
export async function listApprovedReviews(roomId: string, limit = 20): Promise<ReviewDTO[]> {
  if (!mongoose.isValidObjectId(roomId)) return [];
  await connectDB();
  const reviews = await Review.find({ room: roomId, status: "APPROVED" })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .lean();
  return serialize(reviews) as unknown as ReviewDTO[];
}

export async function listAdminReviews(status?: ReviewStatus): Promise<ReviewDTO[]> {
  await connectDB();
  const filter = status ? { status } : {};
  const reviews = await Review.find(filter)
    .populate("room", "name slug")
    .sort({ createdAt: -1 })
    .lean();
  return serialize(reviews) as unknown as ReviewDTO[];
}

export async function moderateReview(
  reviewId: string,
  adminId: string,
  data: ReviewModerationInput,
): Promise<ReviewDTO> {
  if (!mongoose.isValidObjectId(reviewId)) throw new ReviewError(400, "Invalid review id.");
  await connectDB();
  const review = await Review.findById(reviewId);
  if (!review) throw new ReviewError(404, "Review not found.");

  review.status = data.status;
  review.moderatedAt = new Date();
  review.moderatedBy = new mongoose.Types.ObjectId(adminId);
  await review.save();
  await refreshRoomRating(review.room);

  return serialize(review.toObject()) as unknown as ReviewDTO;
}

export async function deleteReview(reviewId: string): Promise<void> {
  if (!mongoose.isValidObjectId(reviewId)) throw new ReviewError(400, "Invalid review id.");
  await connectDB();
  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) throw new ReviewError(404, "Review not found.");

  await refreshRoomRating(review.room);
  // Storage cleanup must not make the database record reappear if Cloudinary
  // is unavailable. A missing image is safer than a deleted review returning.
  await Promise.allSettled(
    review.images.map((image) => (image.publicId ? deleteImage(image.publicId) : Promise.resolve())),
  );
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}

function isReviewUpload(image: { url: string; publicId?: string }) {
  try {
    const url = new URL(image.url);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.includes("/greenova/reviews/") &&
      image.publicId?.startsWith("greenova/reviews/")
    );
  } catch {
    return false;
  }
}
