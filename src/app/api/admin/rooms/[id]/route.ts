import { updateRoom, deleteRoom } from "@/services/room.service";
import { roomSchema } from "@/validators/room";
import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const parsed = roomSchema.partial().safeParse(await req.json());

    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    try {
      const room = await updateRoom(id, parsed.data);
      if (!room) throw new HttpError(404, "Room not found.");
      return Response.json({ room });
    } catch (err) {
      if (err instanceof Error && err.message.includes("slug")) {
        throw new HttpError(409, err.message);
      }
      throw err;
    }
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;

    const result = await deleteRoom(id);
    if (!result) throw new HttpError(404, "Room not found.");

    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
