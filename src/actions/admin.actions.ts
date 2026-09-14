"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { updateBookingAsAdmin, BookingError } from "@/services/booking.service";
import { writeAdminLog } from "@/services/admin-log.service";
import { updateBookingSchema } from "@/validators/booking";
import type { BookingDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

export async function updateBookingAction(
  id: string,
  input: unknown,
): Promise<ActionResult<BookingDTO>> {
  try {
    const session = await requireAdmin();
    const parsed = updateBookingSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid update." };

    const booking = await updateBookingAsAdmin(id, parsed.data, session.user.id);
    await writeAdminLog({ adminId: session.user.id, action: "BOOKING_UPDATED", targetType: "Booking", targetId: id, detail: parsed.data.bookingStatus ?? parsed.data.status ?? "note" });

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
