import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { createGallery, listGallery } from "@/services/content.service";
import { gallerySchema } from "@/validators/content";
export async function GET() { try { await requireAdmin(); return Response.json(await listGallery()); } catch (err) { return errorResponse(err); } }
export async function POST(req: Request) { try { await requireAdmin(); const parsed = gallerySchema.safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid gallery image."); return Response.json(await createGallery(parsed.data), { status: 201 }); } catch (err) { return errorResponse(err); } }
