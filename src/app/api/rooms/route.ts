import { listActiveRooms } from "@/services/room.service";
import { findAvailableRooms } from "@/services/availability.service";
import { errorResponse } from "@/lib/guards";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    // With a date range, annotate each room with live availability.
    if (checkIn && checkOut) {
      const rooms = await findAvailableRooms({
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        adults: Number(searchParams.get("adults") ?? 1),
        children: Number(searchParams.get("children") ?? 0),
      });
      return Response.json({ rooms });
    }

    return Response.json({ rooms: await listActiveRooms() });
  } catch (err) {
    return errorResponse(err);
  }
}
