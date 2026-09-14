import { uploadImage, cloudinaryEnabled } from "@/lib/cloudinary";
import { requireUser, errorResponse, HttpError } from "@/lib/guards";
import { assertReviewEligibility, getReviewForBooking } from "@/services/review.service";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Uploads one image only after proving the caller may review this booking. */
export async function POST(req: Request) {
  try {
    const session = await requireUser();
    if (!cloudinaryEnabled) {
      throw new HttpError(501, "Image uploads are unavailable right now. You can still submit a text review.");
    }

    const form = await req.formData();
    const bookingId = form.get("bookingId");
    const file = form.get("file");
    if (typeof bookingId !== "string") throw new HttpError(400, "Booking id is required.");
    if (!(file instanceof File)) throw new HttpError(400, "No image was provided.");
    if (!ALLOWED.includes(file.type)) throw new HttpError(400, "Only JPEG, PNG, WebP or AVIF images are allowed.");
    if (file.size > MAX_BYTES) throw new HttpError(400, "Images must be under 5 MB.");

    await assertReviewEligibility(bookingId, session.user.id);
    if (await getReviewForBooking(bookingId, session.user.id)) {
      throw new HttpError(409, "You have already reviewed this stay.");
    }

    const result = await uploadImage(Buffer.from(await file.arrayBuffer()), "greenova/reviews");
    return Response.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
