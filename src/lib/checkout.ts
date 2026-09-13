/**
 * Client-side Razorpay checkout helper.
 *
 * When the server reports provider === "mock" (no API keys configured) we
 * skip the hosted widget entirely and synthesise the identifiers the mock
 * verifier expects, so the booking flow is testable end-to-end offline.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface OrderPayload {
  orderId: string;
  amount: number;
  currency: string;
  provider: "razorpay" | "mock";
  keyId: string | null;
  reference: string;
  guest: { name: string; email: string; phone: string };
}

export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Resolves with the payment identifiers, or rejects if the guest dismisses it. */
export function openRazorpayCheckout(order: OrderPayload): Promise<CheckoutResult> {
  // Mock mode — resolve immediately with identifiers the server will accept.
  if (order.provider === "mock") {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `mock_pay_${Math.random().toString(16).slice(2, 12)}`,
          razorpay_signature: "mock_signature",
        });
      }, 900);
    });
  }

  return new Promise(async (resolve, reject) => {
    const ready = await loadRazorpayScript();
    if (!ready || !window.Razorpay) {
      reject(new Error("Could not load the payment gateway. Check your connection."));
      return;
    }

    if (!order.keyId) {
      reject(new Error("Payment gateway is not configured."));
      return;
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Greenova Retreat & Spa",
      description: `Reservation ${order.reference}`,
      order_id: order.orderId,
      prefill: {
        name: order.guest.name,
        email: order.guest.email,
        contact: order.guest.phone,
      },
      notes: { reference: order.reference },
      theme: { color: "#1d5641" },
      handler: (response: CheckoutResult) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });

    rzp.open();
  });
}
