import { createPaymentOrder } from "@/services/payment.service";
import { createOrderSchema } from "@/validators/payment";
import { requireUser, errorResponse, HttpError } from "@/lib/guards";

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const parsed = createOrderSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid booking id.");

    const order = await createPaymentOrder(parsed.data.bookingId, session.user.id);
    return Response.json(order);
  } catch (err) {
    return errorResponse(err);
  }
}
