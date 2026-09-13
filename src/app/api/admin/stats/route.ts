import { getDashboardData } from "@/services/stats.service";
import { requireAdmin, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await getDashboardData());
  } catch (err) {
    return errorResponse(err);
  }
}
