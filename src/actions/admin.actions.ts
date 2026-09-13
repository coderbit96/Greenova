"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { updateBookingAsAdmin, BookingError } from "@/services/booking.service";
import { updateBookingSchema } from "@/validators/booking";
import type { BookingDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

export async function updateBookingAction(
  id: string,
  input: unknown,
): Promise<ActionResult<BookingDTO>> {
  try {
    await requireAdmin();
    const parsed = updateBookingSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid update." };

    const booking = await updateBookingAsAdmin(id, parsed.data);

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath("/account/bookings");
    return { ok: true, data: booking };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    console.error("[action]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
