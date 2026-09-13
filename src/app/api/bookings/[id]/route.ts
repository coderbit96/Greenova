import { cancelBooking, getBookingById, canAccessBooking } from "@/services/booking.service";
import { cancelBookingSchema } from "@/validators/booking";
import { requireUser, errorResponse, HttpError } from "@/lib/guards";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;

    const booking = await getBookingById(id);
    if (!booking) throw new HttpError(404, "Booking not found.");

    if (!canAccessBooking(booking, { id: session.user.id, role: session.user.role })) {
      throw new HttpError(403, "You cannot view this booking.");
    }

    return Response.json({ booking });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Customer-initiated cancellation. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await ctx.params;

    // A DELETE may legitimately carry no body.
    let reason = "Cancelled by guest";
    try {
      const parsed = cancelBookingSchema.safeParse(await req.json());
      if (parsed.success && parsed.data.reason?.trim()) reason = parsed.data.reason;
    } catch {
      // No body supplied — keep the default reason.
    }

    const booking = await cancelBooking(
      id,
      { id: session.user.id, role: session.user.role },
      reason,
    );

    return Response.json({ booking });
  } catch (err) {
    return errorResponse(err);
  }
}
