"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, RotateCcw, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge, { statusTone } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils";
import { updateBookingAction } from "@/actions/admin.actions";
import type { PopulatedBookingDTO } from "@/types/models";

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

export default function AdminBookings({ initialBookings }: { initialBookings: PopulatedBookingDTO[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return initialBookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (!term) return true;
      return (
        b.reference.toLowerCase().includes(term) ||
        b.guest.name.toLowerCase().includes(term) ||
        b.guest.email.toLowerCase().includes(term)
      );
    });
  }, [initialBookings, status, q]);

  async function update(id: string, body: Record<string, unknown>, successMsg: string) {
    setBusy(id);
    try {
      const result = await updateBookingAction(id, body);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMsg);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Bookings</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {initialBookings.length} total · showing {filtered.length}
      </p>

      {/* Filters — one row above the table */}
      <div className="mt-8 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, name or email…"
            aria-label="Search bookings"
            className="w-full rounded-full border border-border-base bg-bg-elevated py-2.5 pr-4 pl-11 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                status === s
                  ? "bg-forest-700 text-white dark:bg-forest-600"
                  : "bg-bg-subtle text-fg-muted hover:text-fg"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border-base py-20 text-center text-sm text-fg-muted">
          No bookings match this view.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Room</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Stay</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {filtered.map((b) => (
                  <Fragment key={b._id}>
                    <tr
                      onClick={() => setExpanded(expanded === b._id ? null : b._id)}
                      className="cursor-pointer transition-colors hover:bg-bg-subtle"
                    >
                      <td className="px-5 py-4 font-medium whitespace-nowrap">{b.reference}</td>
                      <td className="px-5 py-4">
                        <p className="text-fg">{b.guest.name}</p>
                        <p className="truncate text-xs text-fg-muted">{b.guest.email}</p>
                      </td>
                      <td className="hidden px-5 py-4 text-fg-muted lg:table-cell">
                        {b.room?.name ?? "—"}
                      </td>
                      <td className="hidden px-5 py-4 whitespace-nowrap text-fg-muted md:table-cell">
                        {formatDate(b.checkIn)} — {formatDate(b.checkOut)}
                        <span className="block text-xs">
                          {b.nights} {b.nights === 1 ? "night" : "nights"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                          <Badge tone={statusTone(b.payment.status)}>{b.payment.status}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium whitespace-nowrap">
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <div
                          className="flex justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {b.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === b._id}
                              onClick={() =>
                                update(b._id, { status: "confirmed" }, "Booking confirmed.")
                              }
                              aria-label="Confirm booking"
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                          {b.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === b._id}
                              onClick={() =>
                                update(b._id, { status: "completed" }, "Marked as completed.")
                              }
                            >
                              Complete
                            </Button>
                          )}
                          {b.payment.status === "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === b._id}
                              onClick={() => {
                                if (!confirm(`Refund ${formatCurrency(b.totalAmount)} for ${b.reference}?`))
                                  return;
                                update(
                                  b._id,
                                  { status: "cancelled", refund: true },
                                  "Booking cancelled and refunded.",
                                );
                              }}
                              aria-label="Refund and cancel"
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          )}
                          {b.status !== "cancelled" && b.payment.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === b._id}
                              onClick={() => {
                                if (!confirm(`Cancel ${b.reference}?`)) return;
                                update(b._id, { status: "cancelled" }, "Booking cancelled.");
                              }}
                              className="text-red-600 dark:text-red-400"
                              aria-label="Cancel booking"
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expanded === b._id && (
                      <tr className="bg-bg-subtle">
                        <td colSpan={7} className="px-5 py-5">
                          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Detail label="Phone" value={b.guest.phone} />
                            <Detail
                              label="Guests"
                              value={`${b.guests.adults} adults, ${b.guests.children} children`}
                            />
                            <Detail label="Payment via" value={b.payment.provider} />
                            <Detail label="Booked on" value={formatDate(b.createdAt)} />
                            {b.specialRequests && (
                              <div className="sm:col-span-2 lg:col-span-4">
                                <dt className="text-xs tracking-wider text-fg-muted uppercase">
                                  Special requests
                                </dt>
                                <dd className="mt-1 text-sm">{b.specialRequests}</dd>
                              </div>
                            )}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wider text-fg-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm capitalize">{value}</dd>
    </div>
  );
}
