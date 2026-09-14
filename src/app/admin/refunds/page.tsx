import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listRefunds } from "@/services/booking.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Refunds",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/refunds");

  const { refunds, totalRefunded } = await listRefunds();

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Refunds</h1>
      <p className="mt-3 text-sm text-fg-muted">
        {refunds.length} {refunds.length === 1 ? "refund" : "refunds"} ·{" "}
        {formatCurrency(totalRefunded)} returned
      </p>

      {refunds.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center text-sm leading-relaxed text-fg-muted">
          No refunds issued. Cancelling a paid booking refunds it automatically.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {refunds.map((r) => (
            <li
              key={r._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border-base bg-bg-elevated p-6"
            >
              <div className="min-w-0">
                <p className="font-medium text-fg">{r.reference}</p>
                <p className="truncate text-sm text-fg-muted">
                  {r.guest.name} · {r.guest.email}
                </p>
                {r.cancellationReason && (
                  <p className="mt-1 text-xs text-fg-muted">{r.cancellationReason}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-medium">
                  {formatCurrency(r.totalAmount)}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {r.payment.refundedAt ? formatDate(r.payment.refundedAt) : "processing"}
                </p>
                <div className="mt-1.5">
                  <Badge tone="brass">Refunded</Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
