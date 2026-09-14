import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { deleteGallery, updateGallery } from "@/services/content.service";
import { gallerySchema } from "@/validators/content";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); const parsed = gallerySchema.partial().safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid gallery image."); return Response.json(await updateGallery((await params).id, parsed.data)); } catch (err) { return errorResponse(err); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); await deleteGallery((await params).id); return new Response(null, { status: 204 }); } catch (err) { return errorResponse(err); } }
