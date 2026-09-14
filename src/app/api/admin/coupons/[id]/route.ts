import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { updateCoupon } from "@/services/coupon.service";
import { couponSchema } from "@/validators/coupon";
import { writeAdminLog } from "@/services/admin-log.service";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const parsed = couponSchema.partial().safeParse(await req.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) throw new HttpError(400, "Invalid coupon update.");
    const id = (await ctx.params).id;
    const coupon = await updateCoupon(id, parsed.data);
    await writeAdminLog({ adminId: session.user.id, action: "COUPON_UPDATED", targetType: "Coupon", targetId: id });
    return Response.json({ coupon });
  } catch (error) { return errorResponse(error); }
}
