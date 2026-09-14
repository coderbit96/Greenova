import { requireAdmin, errorResponse } from "@/lib/guards";
import { listEnquiries } from "@/services/content.service";
export async function GET() { try { await requireAdmin(); return Response.json(await listEnquiries()); } catch (err) { return errorResponse(err); } }
