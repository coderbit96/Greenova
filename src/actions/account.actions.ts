"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guards";
import { updateUserProfile, UserError } from "@/services/user.service";
import { profileSchema } from "@/validators/account";
import type { UserDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

export async function updateProfileAction(input: unknown): Promise<ActionResult<UserDTO>> {
  try {
    const session = await requireUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check your profile details.",
        issues: parsed.error.flatten().fieldErrors,
      };
    }

    const user = await updateUserProfile(session.user.id, parsed.data);
    revalidatePath("/account", "layout");
    return { ok: true, data: user };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error("[account action]", error);
    return { ok: false, error: "Could not update your profile. Please try again." };
  }
}
