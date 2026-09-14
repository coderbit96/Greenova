/**
 * Converts a user-supplied post-auth location into a path that is guaranteed
 * to stay on this site. Never pass a query-string callback directly to a
 * router or OAuth provider.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/account/bookings") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\\\")) {
    return fallback;
  }

  try {
    const target = new URL(value, "https://greenova.invalid");
    return target.origin === "https://greenova.invalid"
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
