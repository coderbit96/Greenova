import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { deleteAmenity, updateAmenity } from "@/services/content.service";
import { amenitySchema } from "@/validators/content";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); const parsed = amenitySchema.partial().safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid amenity."); return Response.json(await updateAmenity((await params).id, parsed.data)); } catch (err) { return errorResponse(err); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); await deleteAmenity((await params).id); return new Response(null, { status: 204 }); } catch (err) { return errorResponse(err); } }
