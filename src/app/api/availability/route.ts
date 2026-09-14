import { availabilitySchema } from "@/validators/booking";
import { findAvailableRooms, getRoomAvailability } from "@/services/availability.service";
import { errorResponse } from "@/lib/guards";
import { toUTCDay } from "@/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = availabilitySchema.safeParse({
      checkIn: searchParams.get("checkIn") ?? "",
      checkOut: searchParams.get("checkOut") ?? "",
      adults: searchParams.get("adults") ?? 2,
      children: searchParams.get("children") ?? 0,
      rooms: searchParams.get("rooms") ?? 1,
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid search", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { checkIn, checkOut, adults, children, rooms: unitsWanted } = parsed.data;
    const roomId = searchParams.get("roomId");

    // A room id narrows the query to that room's remaining units.
    if (roomId) {
      return Response.json(
        await getRoomAvailability(roomId, toUTCDay(checkIn), toUTCDay(checkOut), undefined, unitsWanted),
      );
    }

    const rooms = await findAvailableRooms({
      checkIn: toUTCDay(checkIn),
      checkOut: toUTCDay(checkOut),
      adults,
      children,
      rooms: unitsWanted,
    });

    return Response.json({ rooms });
  } catch (err) {
    return errorResponse(err);
  }
}
