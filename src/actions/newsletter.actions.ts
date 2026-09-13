"use server";

import { z } from "zod";
import type { ActionResult } from "./booking.actions";

const subscribeSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
});

/**
 * Newsletter sign-up.
 *
 * Nothing is persisted yet: there is no mailing-list provider configured, so
 * this validates and logs. Wire up Mailchimp/Resend Audiences here and the
 * form keeps working unchanged.
 */
export async function subscribeAction(
  input: unknown,
): Promise<ActionResult<{ subscribed: true }>> {
  const parsed = subscribeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  console.log("[newsletter] subscribe:", parsed.data.email);

  return { ok: true, data: { subscribed: true } };
}
