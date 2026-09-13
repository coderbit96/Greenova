"use server";

import { contactSchema } from "@/validators/contact";
import type { ActionResult } from "./booking.actions";

export async function sendContactAction(
  input: unknown,
): Promise<ActionResult<{ sent: true }>> {
  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form.",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  // Wire up an email provider (Resend, SES, Nodemailer) here when available.
  console.log("[contact]", parsed.data.email, "-", parsed.data.subject);

  return { ok: true, data: { sent: true } };
}
