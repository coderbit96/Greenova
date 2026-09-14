import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { createAmenity, listAmenities } from "@/services/content.service";
import { amenitySchema } from "@/validators/content";
export async function GET() { try { await requireAdmin(); return Response.json(await listAmenities()); } catch (err) { return errorResponse(err); } }
export async function POST(req: Request) { try { await requireAdmin(); const parsed = amenitySchema.safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid amenity."); return Response.json(await createAmenity(parsed.data), { status: 201 }); } catch (err) { return errorResponse(err); } }
