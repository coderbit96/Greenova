import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { deleteReview, moderateReview } from "@/services/review.service";
import { reviewModerationSchema } from "@/validators/review";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const parsed = reviewModerationSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid moderation status.");
    const { id } = await params;
    return Response.json(await moderateReview(id, session.user.id, parsed.data));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteReview(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
