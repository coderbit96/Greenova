import crypto from "crypto";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

/** Real gateway only when both credentials are present. */
export const razorpayEnabled = Boolean(keyId && keySecret);

let client: Razorpay | null = null;
function getClient(): Razorpay {
  if (!razorpayEnabled) throw new Error("Razorpay is not configured");
  client ??= new Razorpay({ key_id: keyId!, key_secret: keySecret! });
  return client;
}

export interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  provider: "razorpay" | "mock";
  keyId: string | null;
}

export async function createOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string> = {},
): Promise<CreatedOrder> {
  if (!razorpayEnabled) {
    // Mock gateway: lets the whole booking flow run without credentials.
    return {
      orderId: `mock_order_${crypto.randomBytes(10).toString("hex")}`,
      amount: amountPaise,
      currency: "INR",
      provider: "mock",
      keyId: null,
    };
  }

  const order = await getClient().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes,
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    provider: "razorpay",
    keyId: keyId!,
  };
}

/**
 * Verifies the Razorpay checkout signature.
 * HMAC-SHA256 of "<order_id>|<payment_id>" keyed with the secret, compared
 * in constant time so the check can't be timing-probed.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { orderId, paymentId, signature } = params;

  if (!razorpayEnabled) {
    // Mock mode accepts only mock-issued identifiers.
    return orderId.startsWith("mock_order_") && paymentId.startsWith("mock_pay_");
  }

  const expected = crypto
    .createHmac("sha256", keySecret!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Verifies a webhook body against the webhook secret. */
export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function refundPayment(paymentId: string, amountPaise?: number) {
  if (!razorpayEnabled) {
    return { id: `mock_rfnd_${crypto.randomBytes(8).toString("hex")}`, status: "processed" };
  }
  return getClient().payments.refund(paymentId, amountPaise ? { amount: amountPaise } : {});
}
