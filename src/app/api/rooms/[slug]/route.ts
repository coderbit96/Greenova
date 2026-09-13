import { getRoomBySlug } from "@/services/room.service";
import { getBlockedDates } from "@/services/availability.service";
import { errorResponse } from "@/lib/guards";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const room = await getRoomBySlug(slug);
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

    const blockedDates = await getBlockedDates(room._id);
    return Response.json({ room, blockedDates });
  } catch (err) {
    return errorResponse(err);
  }
}
