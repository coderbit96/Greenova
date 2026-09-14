import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { updateEnquiryStatus } from "@/services/content.service";
import { enquiryStatusSchema } from "@/validators/content";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); const parsed = enquiryStatusSchema.safeParse(await req.json()); if (!parsed.success) throw new HttpError(400, "Invalid enquiry status."); return Response.json(await updateEnquiryStatus((await params).id, parsed.data.status)); } catch (err) { return errorResponse(err); } }
