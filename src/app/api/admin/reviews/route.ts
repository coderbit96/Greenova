import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { listAdminReviews } from "@/services/review.service";
import type { ReviewStatus } from "@/types/models";

const VALID_STATUSES = new Set<ReviewStatus>(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const status = new URL(req.url).searchParams.get("status");
    if (status && !VALID_STATUSES.has(status as ReviewStatus)) {
      throw new HttpError(400, "Invalid review status.");
    }
    return Response.json(await listAdminReviews(status as ReviewStatus | undefined));
  } catch (err) {
    return errorResponse(err);
  }
}
