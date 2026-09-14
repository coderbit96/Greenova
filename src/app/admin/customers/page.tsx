import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listCustomers } from "@/services/user.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/customers");

  const customers = await listCustomers();

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Customers</h1>
      <p className="mt-3 text-sm text-fg-muted">
        {customers.length} registered {customers.length === 1 ? "guest" : "guests"}.
      </p>

      {customers.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center text-sm text-fg-muted">
          No customers yet.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Guest</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Joined</th>
                  <th className="px-6 py-3 font-medium">Sign-in</th>
                  <th className="px-6 py-3 text-right font-medium">Bookings</th>
                  <th className="px-6 py-3 text-right font-medium">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {customers.map((c) => (
                  <tr key={c._id} className="transition-colors hover:bg-bg-subtle">
                    <td className="px-6 py-4">
                      <p className="font-medium text-fg">{c.name}</p>
                      <p className="truncate text-xs text-fg-muted">{c.email}</p>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-fg-muted md:table-cell">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={c.provider === "google" ? "info" : "neutral"}>
                        {c.provider === "google" ? "Google" : "Email"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">{c.bookingCount}</td>
                    <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                      {formatCurrency(c.totalSpend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
