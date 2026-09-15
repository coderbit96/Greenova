"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

type Room = { _id: string; name: string; category: string };
const fieldClass = "w-full rounded-xl border border-border-base bg-bg px-3 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20";

export default function AdminManualBooking({ rooms, today }: { rooms: Room[]; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: form.get("roomId"), checkIn: form.get("checkIn"), checkOut: form.get("checkOut"),
          adults: Number(form.get("adults")), children: Number(form.get("children")), roomsBooked: Number(form.get("roomsBooked")),
          guestName: form.get("guestName"), guestEmail: form.get("guestEmail"), guestPhone: form.get("guestPhone"),
          guestAddress: form.get("guestAddress") || undefined, specialRequests: form.get("specialRequests") || undefined,
          paymentMethod: form.get("paymentMethod"), paid: form.get("paid") === "on",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { toast.error(result.error ?? "Could not create the manual booking."); return; }
      toast.success(`Manual booking ${result.booking.reference} created.`);
      setOpen(false);
      router.refresh();
    } finally { setBusy(false); }
  }

  if (!open) return <Button onClick={() => setOpen(true)}>Add manual booking</Button>;

  return (
    <section className="mt-6 rounded-3xl border border-border-base bg-bg-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-medium">Manual booking</h2><p className="mt-1 text-sm text-fg-muted">For walk-ins, phone reservations, corporate stays, and offline payment.</p></div><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button></div>
      <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium">Room<select name="roomId" required className={`${fieldClass} mt-1.5`}><option value="">Select a room type</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.name} · {room.category}</option>)}</select></label>
        <label className="text-sm font-medium">Check-in<input name="checkIn" type="date" min={today} required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Check-out<input name="checkOut" type="date" min={today} required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Adults<input name="adults" type="number" min="1" max="20" defaultValue="2" required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Children<input name="children" type="number" min="0" max="20" defaultValue="0" required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Rooms booked<input name="roomsBooked" type="number" min="1" max="10" defaultValue="1" required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Guest name<input name="guestName" autoComplete="name" required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Guest email<input name="guestEmail" type="email" autoComplete="email" required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Guest phone<input name="guestPhone" type="tel" autoComplete="tel" required className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Payment method<select name="paymentMethod" defaultValue="cash" className={`${fieldClass} mt-1.5`}><option value="cash">Cash</option><option value="card_at_hotel">Card at hotel</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option><option value="razorpay">Razorpay (record only)</option></select></label>
        <label className="flex min-h-11 items-center gap-2 self-end text-sm font-medium"><input name="paid" type="checkbox" className="size-4 accent-forest-600" /> Payment received</label>
        <div className="hidden xl:block" />
        <label className="text-sm font-medium md:col-span-2 xl:col-span-3">Address (optional)<input name="guestAddress" autoComplete="street-address" className={`${fieldClass} mt-1.5`} /></label>
        <label className="text-sm font-medium md:col-span-2 xl:col-span-3">Internal / special requests (optional)<textarea name="specialRequests" rows={2} className={`${fieldClass} mt-1.5 resize-y`} /></label>
        <div className="flex justify-end md:col-span-2 xl:col-span-3"><Button type="submit" loading={busy}>Create confirmed booking</Button></div>
      </form>
    </section>
  );
}
