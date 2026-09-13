"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guards";
import {
  cancelBooking as cancelBookingService,
  createBooking as createBookingService,
  BookingError,
} from "@/services/booking.service";
import { bookingSchema, cancelBookingSchema } from "@/validators/booking";
import type { BookingDTO } from "@/types/models";

/**
 * Server Actions for guest booking mutations.
 *
 * Every action authenticates and validates on the server, so a component
 * never carries authorization or transport concerns.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: Record<string, string[] | undefined> };

function toError(err: unknown): ActionResult<never> {
  if (err instanceof BookingError) return { ok: false, error: err.message };
  console.error("[action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createBookingAction(
  input: unknown,
): Promise<ActionResult<BookingDTO>> {
  try {
    const session = await requireUser();
    const parsed = bookingSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the form.",
        issues: parsed.error.flatten().fieldErrors,
      };
    }

    const booking = await createBookingService(session.user.id, parsed.data);
    revalidatePath("/account/bookings");
    return { ok: true, data: booking };
  } catch (err) {
    return toError(err);
  }
}

export async function cancelBookingAction(
  bookingId: string,
  input?: unknown,
): Promise<ActionResult<BookingDTO>> {
  try {
    const session = await requireUser();
    const parsed = cancelBookingSchema.safeParse(input ?? {});
    const reason = parsed.success ? parsed.data.reason : undefined;

    const booking = await cancelBookingService(
      bookingId,
      { id: session.user.id, role: session.user.role },
      reason || "Cancelled by guest",
    );

    revalidatePath("/account/bookings");
    revalidatePath(`/booking/confirmation/${bookingId}`);
    return { ok: true, data: booking };
  } catch (err) {
    return toError(err);
  }
}
