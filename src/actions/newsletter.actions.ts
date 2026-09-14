"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { allowRateLimited, clientAddress } from "@/lib/rate-limit";
import { subscribeNewsletter } from "@/services/newsletter.service";
import type { ActionResult } from "./booking.actions";

const subscribeSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
});

/**
 * Newsletter sign-up.
 *
 * Subscriptions are retained locally. A future campaign provider can sync
 * this collection without changing the public form contract.
 */
export async function subscribeAction(
  input: unknown,
): Promise<ActionResult<{ subscribed: true }>> {
  const requestHeaders = await headers();
  const throttle = allowRateLimited(`newsletter:${clientAddress(requestHeaders)}`, 5, 60 * 60 * 1_000);
  if (!throttle.allowed) return { ok: false, error: "Please try again later." };

  const parsed = subscribeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await subscribeNewsletter(parsed.data.email);
  } catch (error) {
    console.error("[newsletter] subscription failed", error);
    return { ok: false, error: "Could not save your subscription. Please try again." };
  }

  return { ok: true, data: { subscribed: true } };
}
