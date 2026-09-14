import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";
import { createCoupon, listCoupons } from "@/services/coupon.service";
import { couponSchema } from "@/validators/coupon";
import { writeAdminLog } from "@/services/admin-log.service";

export async function GET() {
  try { await requireAdmin(); return Response.json({ coupons: await listCoupons() }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const parsed = couponSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid coupon.");
    const coupon = await createCoupon(parsed.data);
    await writeAdminLog({ adminId: session.user.id, action: "COUPON_CREATED", targetType: "Coupon", targetId: String((coupon as unknown as { _id?: string })._id), detail: parsed.data.code });
    return Response.json({ coupon }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
