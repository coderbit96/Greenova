"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, RotateCcw, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import Badge, { statusTone } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils";
import { updateBookingAction } from "@/actions/admin.actions";
import type { PopulatedBookingDTO } from "@/types/models";
import AdminManualBooking from "@/components/admin/AdminManualBooking";

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["all", "pending", "paid", "failed", "refunded"] as const;
type PendingConfirmation = { title: string; description: string; confirmLabel: string; action: () => void };

export default function AdminBookings({ initialBookings, rooms }: { initialBookings: PopulatedBookingDTO[]; rooms: { _id: string; name: string; category: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [paymentStatus, setPaymentStatus] = useState<(typeof PAYMENT_STATUSES)[number]>("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return initialBookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (paymentStatus !== "all" && b.payment.status !== paymentStatus) return false;
      if (roomFilter !== "all" && b.room?._id !== roomFilter) return false;
      if (dateFilter && !(b.checkIn.slice(0, 10) <= dateFilter && b.checkOut.slice(0, 10) > dateFilter)) return false;
      if (!term) return true;
      return (
        b.reference.toLowerCase().includes(term) ||
        b.guest.name.toLowerCase().includes(term) ||
        b.guest.email.toLowerCase().includes(term)
      );
    });
  }, [initialBookings, status, paymentStatus, roomFilter, dateFilter, q]);

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
      <div className="mt-3 flex justify-end">
        <AdminManualBooking rooms={rooms} today={new Date().toISOString().slice(0, 10)} />
      </div>
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
        <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)} aria-label="Filter by payment status" className="rounded-full border border-border-base bg-bg-elevated px-4 py-2 text-sm">
          {PAYMENT_STATUSES.map((value) => <option key={value} value={value}>{value === "all" ? "All payments" : `Payment: ${value}`}</option>)}
        </select>
        <select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)} aria-label="Filter by room" className="rounded-full border border-border-base bg-bg-elevated px-4 py-2 text-sm">
          <option value="all">All rooms</option>
          {rooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-full border border-border-base bg-bg-elevated px-4 py-2 text-sm">Stay date<input value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} type="date" aria-label="Filter by stay date" className="bg-transparent outline-none" /></label>
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
                          {b.bookingSource === "ADMIN_MANUAL" && <Badge tone="info">Manual</Badge>}
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
                          {b.bookingStatus === "CONFIRMED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === b._id}
                              onClick={() =>
                                update(b._id, { bookingStatus: "CHECKED_IN" }, "Guest checked in.")
                              }
                            >
                              Check in
                            </Button>
                          )}
                          {b.bookingStatus === "CHECKED_IN" && (
                            <Button size="sm" variant="ghost" disabled={busy === b._id} onClick={() => update(b._id, { bookingStatus: "CHECKED_OUT" }, "Guest checked out.")}>Check out</Button>
                          )}
                          {b.payment.status === "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === b._id}
                              onClick={() => setConfirmation({
                                title: "Refund and cancel booking?",
                                description: `Refund ${formatCurrency(b.totalAmount)} for ${b.reference} and cancel the reservation. This action cannot be undone automatically.`,
                                confirmLabel: "Refund and cancel",
                                action: () => update(b._id, { status: "cancelled", refund: true }, "Booking cancelled and refunded."),
                              })}
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
                              onClick={() => setConfirmation({
                                title: "Cancel booking?",
                                description: `Cancel ${b.reference}? This reservation will no longer hold room inventory.`,
                                confirmLabel: "Cancel booking",
                                action: () => update(b._id, { status: "cancelled" }, "Booking cancelled."),
                              })}
                              className="text-red-600 dark:text-red-400"
                              aria-label="Cancel booking"
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                          {b.status === "confirmed" && b.bookingStatus !== "CHECKED_IN" && (
                            <Button size="sm" variant="ghost" disabled={busy === b._id} onClick={() => setConfirmation({ title: "Mark as no-show?", description: `${b.reference} will be closed as a no-show and inventory released.`, confirmLabel: "Mark no-show", action: () => update(b._id, { bookingStatus: "NO_SHOW" }, "Booking marked as no-show.") })} aria-label="Mark no-show">No-show</Button>
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
                            <Detail label="Payment via" value={b.paymentMethod.replaceAll("_", " ")} />
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
                          <form
                            className="mt-5 flex flex-wrap gap-2 border-t border-border-base pt-4"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const note = new FormData(event.currentTarget).get("note");
                              if (typeof note === "string" && note.trim()) {
                                void update(b._id, { internalNote: note.trim() }, "Internal note added.");
                                event.currentTarget.reset();
                              }
                            }}
                          >
                            <label className="sr-only" htmlFor={`note-${b._id}`}>Add internal note</label>
                            <input id={`note-${b._id}`} name="note" maxLength={1000} placeholder="Add internal note" className="min-w-52 flex-1 rounded-xl border border-border-base bg-bg-elevated px-3 py-2 text-sm" />
                            <Button size="sm" type="submit" disabled={busy === b._id}>Add note</Button>
                          </form>
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
      <ConfirmationDialog
        open={confirmation !== null}
        title={confirmation?.title ?? "Confirm action"}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel ?? "Confirm"}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          const action = confirmation?.action;
          setConfirmation(null);
          action?.();
        }}
        busy={confirmation ? busy !== null : false}
      />
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
