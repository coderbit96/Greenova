import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPayments } from "@/services/booking.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/payments");

  const { payments, totalPaid, totalPending } = await listPayments();

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Payments</h1>
      <p className="mt-3 text-sm text-fg-muted">
        {formatCurrency(totalPaid)} collected · {formatCurrency(totalPending)} outstanding
      </p>

      {payments.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center text-sm text-fg-muted">
          No payments recorded yet.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Booking</th>
                  <th className="px-6 py-3 font-medium">Guest</th>
                  <th className="hidden px-6 py-3 font-medium lg:table-cell">Payment ID</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {payments.map((p) => (
                  <tr key={p._id} className="transition-colors hover:bg-bg-subtle">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">{p.reference}</td>
                    <td className="px-6 py-4">
                      <p className="text-fg">{p.guest.name}</p>
                      <p className="truncate text-xs text-fg-muted">{p.guest.email}</p>
                    </td>
                    <td className="hidden max-w-48 truncate px-6 py-4 font-mono text-xs text-fg-muted lg:table-cell">
                      {p.payment.paymentId ?? "—"}
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-fg-muted md:table-cell">
                      {p.payment.paidAt ? formatDate(p.payment.paidAt) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={statusTone(p.payment.status)}>{p.payment.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                      {formatCurrency(p.totalAmount)}
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
