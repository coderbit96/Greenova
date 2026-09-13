import { updateBookingAsAdmin } from "@/services/booking.service";
import { updateBookingSchema } from "@/validators/booking";
import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;

    const parsed = updateBookingSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid update.");

    const booking = await updateBookingAsAdmin(id, parsed.data);
    return Response.json({ booking });
  } catch (err) {
    return errorResponse(err);
  }
}
