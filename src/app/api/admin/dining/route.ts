import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { createDining, listDining } from "@/services/content.service";
import { diningSchema } from "@/validators/content";
export async function GET() { try { await requireAdmin(); return Response.json(await listDining()); } catch (err) { return errorResponse(err); } }
export async function POST(req: Request) { try { await requireAdmin(); const parsed = diningSchema.safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid dining venue."); return Response.json(await createDining(parsed.data), { status: 201 }); } catch (err) { return errorResponse(err); } }
