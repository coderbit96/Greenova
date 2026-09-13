import { permanentRedirect } from "next/navigation";

/**
 * Moved to /checkout. Kept as a permanent redirect so links shared before the
 * move keep working; the query string carries the stay through.
 */
export default async function LegacyCheckoutRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v === undefined ? [] : [[k, Array.isArray(v) ? v[0] : v] as [string, string]],
    ),
  ).toString();

  permanentRedirect(query ? `/checkout?${query}` : "/checkout");
}
