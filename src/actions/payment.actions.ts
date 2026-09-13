"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guards";
import {
  createPaymentOrder,
  verifyPayment,
  type OrderResult,
} from "@/services/payment.service";
import { BookingError } from "@/services/booking.service";
import { verifyPaymentSchema } from "@/validators/payment";
import type { BookingDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

function toError(err: unknown): ActionResult<never> {
  if (err instanceof BookingError) return { ok: false, error: err.message };
  console.error("[action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createOrderAction(
  bookingId: string,
): Promise<ActionResult<OrderResult>> {
  try {
    const session = await requireUser();
    const order = await createPaymentOrder(bookingId, session.user.id);
    return { ok: true, data: order };
  } catch (err) {
    return toError(err);
  }
}

export async function verifyPaymentAction(
  input: unknown,
): Promise<ActionResult<BookingDTO>> {
  try {
    const session = await requireUser();
    const parsed = verifyPaymentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid payment payload." };

    const { booking } = await verifyPayment(parsed.data, session.user.id);

    revalidatePath("/account/bookings");
    revalidatePath(`/booking/confirmation/${parsed.data.bookingId}`);
    return { ok: true, data: booking };
  } catch (err) {
    return toError(err);
  }
}
