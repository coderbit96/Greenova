import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { createManualBooking } from "@/services/booking.service";
import { writeAdminLog } from "@/services/admin-log.service";
import { manualBookingSchema } from "@/validators/booking";

/** Administrator-only endpoint for walk-in and other offline reservations. */
export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const parsed = manualBookingSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new HttpError(400, "Please check the manual booking details.");
    }

    const booking = await createManualBooking(session.user.id, parsed.data);
    await writeAdminLog({
      adminId: session.user.id,
      action: "MANUAL_BOOKING_CREATED",
      targetType: "Booking",
      targetId: booking._id,
      detail: booking.reference,
    });
    return Response.json({ booking }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
