"use server";

import { registerUser, UserError } from "@/services/user.service";
import { registerSchema } from "@/validators/auth";
import { allowRateLimited, clientAddress } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { UserDTO } from "@/types/models";
import type { ActionResult } from "./booking.actions";

export async function registerAction(input: unknown): Promise<ActionResult<UserDTO>> {
  try {
    const requestHeaders = await headers();
    const throttle = allowRateLimited(`auth:register:${clientAddress(requestHeaders)}`, 5, 60 * 60 * 1_000);
    if (!throttle.allowed) {
      return { ok: false, error: `Too many attempts. Try again in ${throttle.retryAfterSeconds} seconds.` };
    }

    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the form.",
        issues: parsed.error.flatten().fieldErrors,
      };
    }

    const user = await registerUser(parsed.data);
    return { ok: true, data: user };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error("[action]", err);
    return { ok: false, error: "Could not create your account." };
  }
}
