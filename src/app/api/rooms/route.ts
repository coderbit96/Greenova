import { listActiveRooms } from "@/services/room.service";
import { findAvailableRooms } from "@/services/availability.service";
import { errorResponse } from "@/lib/guards";
import { availabilitySchema } from "@/validators/booking";
import { toUTCDay } from "@/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    // With a date range, annotate each room with live availability.
    if (checkIn && checkOut) {
      const parsed = availabilitySchema.safeParse({
        checkIn,
        checkOut,
        adults: searchParams.get("adults") ?? 1,
        children: searchParams.get("children") ?? 0,
        rooms: searchParams.get("rooms") ?? 1,
      });
      if (!parsed.success) {
        return Response.json({ error: "Invalid availability search." }, { status: 400 });
      }
      const rooms = await findAvailableRooms({
        checkIn: toUTCDay(parsed.data.checkIn),
        checkOut: toUTCDay(parsed.data.checkOut),
        adults: parsed.data.adults,
        children: parsed.data.children,
        rooms: parsed.data.rooms,
      });
      return Response.json({ rooms });
    }

    return Response.json({ rooms: await listActiveRooms() });
  } catch (err) {
    return errorResponse(err);
  }
}
