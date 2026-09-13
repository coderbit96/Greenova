import { applyWebhookEvent } from "@/services/payment.service";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook. The safety net for guests who close the tab before the
 * browser callback reaches /api/payments/verify.
 * Set RAZORPAY_WEBHOOK_SECRET and point the dashboard at this route.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhooks not configured" }, { status: 501 });

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  // The signature is computed over the exact raw body.
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(raw);
    const entity = event?.payload?.payment?.entity;
    if (!entity?.order_id) return Response.json({ received: true });

    await applyWebhookEvent(event.event, entity);
    return Response.json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
