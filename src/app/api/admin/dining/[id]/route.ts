import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { deleteDining, updateDining } from "@/services/content.service";
import { diningSchema } from "@/validators/content";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); const parsed = diningSchema.partial().safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid dining venue."); return Response.json(await updateDining((await params).id, parsed.data)); } catch (err) { return errorResponse(err); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); await deleteDining((await params).id); return new Response(null, { status: 204 }); } catch (err) { return errorResponse(err); } }
