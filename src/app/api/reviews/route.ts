import { requireUser, errorResponse, HttpError } from "@/lib/guards";
import { listApprovedReviews, submitReview } from "@/services/review.service";
import { submitReviewSchema } from "@/validators/review";

/** Only approved reviews are ever exposed by this public endpoint. */
export async function GET(req: Request) {
  const roomId = new URL(req.url).searchParams.get("roomId");
  if (!roomId) return Response.json({ error: "roomId is required." }, { status: 400 });
  return Response.json(await listApprovedReviews(roomId));
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const parsed = submitReviewSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid review.");
    const review = await submitReview(session.user.id, parsed.data);
    return Response.json(review, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
