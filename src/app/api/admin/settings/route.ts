import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { getHotelSettings, updateHotelSettings } from "@/services/settings.service";
import { hotelSettingsUpdateSchema } from "@/validators/settings";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ settings: await getHotelSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const parsed = hotelSettingsUpdateSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid settings.");
    return Response.json({ settings: await updateHotelSettings(parsed.data as Record<string, unknown>) });
  } catch (error) {
    return errorResponse(error);
  }
}
