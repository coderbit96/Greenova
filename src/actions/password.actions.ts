"use server";

import { z } from "zod";
import { getUserByEmail } from "@/services/user.service";
import { allowRateLimited, clientAddress } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { ActionResult } from "./booking.actions";

const requestResetSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
});

/**
 * Starts a password reset.
 *
 * The response is deliberately identical whether or not the address is
 * registered — telling a stranger which emails have accounts is an
 * enumeration vector.
 *
 * Delivery is not wired up yet: there is no email provider configured, so
 * it records nothing instead of sending. Add Resend/SES/Nodemailer and a
 * signed, expiring token in `sendResetEmail` below to finish it.
 */
export async function requestPasswordResetAction(
  input: unknown,
): Promise<ActionResult<{ sent: true }>> {
  const requestHeaders = await headers();
  const throttle = allowRateLimited(`auth:reset:${clientAddress(requestHeaders)}`, 5, 15 * 60 * 1_000);
  if (!throttle.allowed) {
    // Keep the same response shape so callers cannot use this endpoint to
    // learn anything about an account.
    return { ok: true, data: { sent: true } };
  }

  const parsed = requestResetSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await getUserByEmail(parsed.data.email);

    if (user) {
      if (user.provider === "google") {
        // Nothing to reset — they sign in through Google. Still returns the
        // same generic result to the caller.
      } else {
      }
    } else {
    }
  } catch (err) {
    // A lookup failure must not reveal itself either; log and carry on.
    console.error("[reset] lookup failed", err);
  }

  return { ok: true, data: { sent: true } };
}
