import { listAllBookings } from "@/services/booking.service";
import { requireAdmin, errorResponse } from "@/lib/guards";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const result = await listAllBookings({
      status: searchParams.get("status") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
    });

    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
