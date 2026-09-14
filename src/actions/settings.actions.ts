"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { updateHotelSettings } from "@/services/settings.service";
import { writeAdminLog } from "@/services/admin-log.service";
import { hotelSettingsUpdateSchema } from "@/validators/settings";
import type { ActionResult } from "./booking.actions";

export async function updateHotelSettingsAction(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const session = await requireAdmin();
    const parsed = hotelSettingsUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please check the settings form." };

    const settings = await updateHotelSettings(parsed.data as Record<string, unknown>);
    await writeAdminLog({ adminId: session.user.id, action: "SETTINGS_UPDATED", targetType: "HotelSettings" });
    for (const path of ["/", "/about", "/contact", "/faq", "/admin/settings", "/admin/website-content"]) {
      revalidatePath(path);
    }
    return { ok: true, data: settings as unknown as Record<string, unknown> };
  } catch (error) {
    console.error("[settings] update failed", error);
    return { ok: false, error: "Could not save settings. Please try again." };
  }
}
