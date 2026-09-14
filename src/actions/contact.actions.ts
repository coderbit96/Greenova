"use server";

import { contactSchema } from "@/validators/contact";
import { createEnquiry, ContentError } from "@/services/content.service";
import { headers } from "next/headers";
import { allowRateLimited } from "@/lib/rate-limit";
import type { ActionResult } from "./booking.actions";

export async function sendContactAction(
  input: unknown,
): Promise<ActionResult<{ sent: true }>> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const rate = allowRateLimited(`contact:${ip}`, 5, 15 * 60 * 1_000);
  if (!rate.allowed) {
    return { ok: false, error: `Too many messages. Please try again in ${rate.retryAfterSeconds} seconds.` };
  }
  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }
  if (parsed.data.website) return { ok: true, data: { sent: true } };

  try {
    await createEnquiry(parsed.data);
    return { ok: true, data: { sent: true } };
  } catch (err) {
    if (err instanceof ContentError) return { ok: false, error: err.message };
    console.error("[contact]", err);
    return { ok: false, error: "Could not send your message. Please try again." };
  }
}
