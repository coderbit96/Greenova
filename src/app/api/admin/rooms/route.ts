import { listAllRooms, createRoom } from "@/services/room.service";
import { roomSchema } from "@/validators/room";
import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ rooms: await listAllRooms() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const parsed = roomSchema.safeParse(await req.json());

    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    try {
      const room = await createRoom(parsed.data);
      return Response.json({ room }, { status: 201 });
    } catch (err) {
      // A duplicate slug is a client conflict, not a server fault.
      if (err instanceof Error && err.message.includes("slug")) {
        throw new HttpError(409, err.message);
      }
      throw err;
    }
  } catch (err) {
    return errorResponse(err);
  }
}
