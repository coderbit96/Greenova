import { permanentRedirect } from "next/navigation";

/**
 * Moved to /payment/status?booking=<id>. Confirmation links may already be
 * sitting in guests' inboxes, so this redirect is permanent rather than a
 * deletion.
 */
export default async function LegacyConfirmationRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/payment/status?booking=${encodeURIComponent(id)}`);
}
