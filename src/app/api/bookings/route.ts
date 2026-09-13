import { createBooking, listUserBookings } from "@/services/booking.service";
import { bookingSchema } from "@/validators/booking";
import { requireUser, errorResponse } from "@/lib/guards";

/** The signed-in user's bookings, newest first. */
export async function GET() {
  try {
    const session = await requireUser();
    return Response.json({ bookings: await listUserBookings(session.user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const parsed = bookingSchema.safeParse(await req.json());

    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const booking = await createBooking(session.user.id, parsed.data);
    return Response.json({ booking }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
