/**
 * Stable route content boundary.
 *
 * This intentionally remains a Server Component: putting a client-only animated
 * boundary around every App Router page can leave a stale lazy chunk during dev
 * refreshes and prevent the entire application from rendering.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>;
}
