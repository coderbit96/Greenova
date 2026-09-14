"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, ArrowRight, X, CreditCard } from "lucide-react";
import Button, { LinkButton } from "@/components/ui/Button";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import Badge, { statusTone } from "@/components/ui/Badge";
import { formatCurrency, formatDate, toUTCDay, todayUTC } from "@/utils";
import { useBookingActions } from "@/hooks/useBookingActions";
import type { PopulatedBookingDTO } from "@/types/models";

const FALLBACK =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop";

type Filter = "upcoming" | "past" | "all";

export default function BookingList({ bookings }: { bookings: PopulatedBookingDTO[] }) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [cancelling, setCancelling] = useState<{ id: string; reference: string } | null>(null);
  const { busyId, cancel, payNow } = useBookingActions();

  const today = todayUTC();

  const filtered = bookings.filter((b) => {
    const isPast = toUTCDay(b.checkOut) < today || b.status === "cancelled";
    if (filter === "upcoming") return !isPast;
    if (filter === "past") return isPast;
    return true;
  });

  function confirmCancel() {
    if (!cancelling) return;
    const { id } = cancelling;
    setCancelling(null);
    void cancel(id);
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border-base py-20 text-center">
        <h2 className="font-display text-2xl font-medium">No bookings yet</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-fg-muted">
          When you reserve a suite it will appear here, with your confirmation and
          cancellation options.
        </p>
        <LinkButton href="/rooms" className="mt-8">
          Browse Suites
        </LinkButton>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex gap-2">
        {(["upcoming", "past", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-forest-700 text-white dark:bg-forest-600"
                : "bg-bg-subtle text-fg-muted hover:text-fg"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border-base py-16 text-center text-sm text-fg-muted">
          No {filter} bookings.
        </p>
      ) : (
        <ul className="space-y-5">
          {filtered.map((b) => {
            const canCancel =
              b.status !== "cancelled" &&
              b.status !== "completed" &&
              toUTCDay(b.checkIn) > today;
            const needsPayment =
              b.payment.status !== "paid" &&
              b.payment.status !== "refunded" &&
              b.status !== "cancelled";
            const busy = busyId === b._id;

            return (
              <li
                key={b._id}
                className="overflow-hidden rounded-3xl border border-border-base bg-bg-elevated transition-shadow hover:shadow-lg"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-44 shrink-0 sm:h-auto sm:w-56">
                    <Image
                      src={b.room?.images?.[0]?.url ?? FALLBACK}
                      alt={b.room?.name ?? "Suite"}
                      fill
                      sizes="(max-width: 640px) 100vw, 224px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-wider text-fg-muted uppercase">
                          {b.reference}
                        </p>
                        <h3 className="mt-1 font-display text-2xl font-medium">
                          {b.room?.name ?? "Suite"}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={statusTone(b.status)}>
                          {b.status[0].toUpperCase() + b.status.slice(1)}
                        </Badge>
                        {b.payment.status !== "paid" && (
                          <Badge tone={statusTone(b.payment.status)}>{b.payment.status}</Badge>
                        )}
                      </div>
                    </div>

                    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
                      <li className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-forest-500" />
                        {formatDate(b.checkIn)} — {formatDate(b.checkOut)}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-forest-500" />
                        {b.guests.adults + b.guests.children} guests · {b.nights}{" "}
                        {b.nights === 1 ? "night" : "nights"}
                      </li>
                    </ul>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                      <p className="font-display text-2xl font-medium">
                        {formatCurrency(b.totalAmount)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {needsPayment && (
                          <Button
                            size="sm"
                            loading={busy}
                            onClick={() => void payNow(b._id)}
                          >
                            <CreditCard className="size-3.5" />
                            Pay now
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setCancelling({ id: b._id, reference: b.reference })}
                          >
                            <X className="size-3.5" />
                            Cancel
                          </Button>
                        )}
                        <Link
                          href={`/account/bookings/${b._id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-50 dark:text-forest-400 dark:hover:bg-forest-900/40"
                        >
                          Details
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmationDialog
        open={cancelling !== null}
        title="Cancel this booking?"
        description={`Cancel booking ${cancelling?.reference ?? ""}? Any eligible payment will be refunded according to the cancellation policy.`}
        confirmLabel="Cancel booking"
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        busy={cancelling ? busyId === cancelling.id : false}
      />
    </>
  );
}
