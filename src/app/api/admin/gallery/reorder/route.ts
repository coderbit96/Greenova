import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { reorderGallery } from "@/services/content.service";
import { z } from "zod";
const schema = z.object({ items: z.array(z.object({ id: z.string().min(1), order: z.number().int().min(0) })).max(500) });
export async function PATCH(req: Request) { try { await requireAdmin(); const parsed = schema.safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid order."); await reorderGallery(parsed.data.items); return Response.json({ ok: true }); } catch (err) { return errorResponse(err); } }
