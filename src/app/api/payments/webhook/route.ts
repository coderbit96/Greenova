import { applyWebhookEvent } from "@/services/payment.service";
import { verifyWebhookSignature } from "@/lib/razorpay";
import crypto from "crypto";

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
    const payment = event?.payload?.payment?.entity;
    const refund = event?.payload?.refund?.entity;
    // Razorpay supplies an event id for normal deliveries. A body hash is a
    // deterministic fallback for test deliveries or proxies that omit it.
    const eventKey =
      req.headers.get("x-razorpay-event-id") ??
      crypto.createHash("sha256").update(raw).digest("hex");

    await applyWebhookEvent(event.event, { payment, refund }, eventKey);
    return Response.json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
