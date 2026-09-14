import { Schema, model, models, type Model } from "mongoose";

/**
 * One immutable receipt per Razorpay webhook delivery.
 *
 * The unique event key makes duplicate deliveries harmless even when a retry
 * arrives while the original request is being processed. The route uses
 * Razorpay's delivery id when available and a SHA-256 raw-body fallback when
 * it is not.
 */
export interface IPaymentWebhookEvent {
  eventKey: string;
  event: string;
  orderId?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentWebhookEventSchema = new Schema<IPaymentWebhookEvent>(
  {
    eventKey: { type: String, required: true, unique: true, index: true },
    event: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    paymentId: { type: String, index: true },
  },
  { timestamps: true },
);

const PaymentWebhookEvent: Model<IPaymentWebhookEvent> =
  models.PaymentWebhookEvent ||
  model<IPaymentWebhookEvent>("PaymentWebhookEvent", PaymentWebhookEventSchema);

export default PaymentWebhookEvent;
