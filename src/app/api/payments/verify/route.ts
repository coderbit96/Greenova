import { verifyPayment } from "@/services/payment.service";
import { verifyPaymentSchema } from "@/validators/payment";
import { requireUser, errorResponse, HttpError } from "@/lib/guards";

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const parsed = verifyPaymentSchema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Invalid payment payload.");

    const { booking, alreadyPaid } = await verifyPayment(parsed.data, session.user.id);
    return Response.json(alreadyPaid ? { booking, alreadyPaid } : { booking });
  } catch (err) {
    return errorResponse(err);
  }
}
