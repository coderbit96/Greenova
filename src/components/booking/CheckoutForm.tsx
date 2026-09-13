"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CreditCard, Info, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import BookingWorkflow from "@/components/booking/BookingWorkflow";
import { formatCurrency, formatDate, priceBreakdown } from "@/utils";
import { guestSchema, type GuestInput } from "@/validators/booking";
import { useCheckout } from "@/hooks/useCheckout";

interface Props {
  room: {
    _id: string;
    name: string;
    slug: string;
    pricePerNight: number;
    discountedPrice?: number;
    taxRatePercent?: number;
    additionalFees?: { label: string; amount: number }[];
    images: { url: string; alt?: string }[];
    bedType: string;
  };
  stay: { checkIn: string; checkOut: string; adults: number; children: number; rooms: number; nights: number };
  user: { name: string; email: string };
}

const FALLBACK = "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop";

export default function CheckoutForm({ room, stay, user }: Props) {
  const { busy, start, step } = useCheckout();
  const [view, setView] = useState<"details" | "review">("details");
  const [guest, setGuest] = useState<GuestInput | null>(null);
  const { nightlyRate, roomTotal, fees, taxes, totalAmount } = priceBreakdown(room, stay.nights, stay.rooms);
  const { register, handleSubmit, formState: { errors } } = useForm<GuestInput>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestName: user.name, guestEmail: user.email, guestPhone: "", guestAddress: "", specialRequests: "" },
  });

  function onSubmit(values: GuestInput) {
    if (view === "details") {
      setGuest(values);
      setView("review");
      return;
    }
    return start({
      roomId: room._id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      adults: stay.adults,
      children: stay.children,
      roomsBooked: stay.rooms,
      ...values,
    });
  }

  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`/rooms/${room.slug}`} className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg">
          <ArrowLeft className="size-4" /> Back to suite
        </Link>
        <h1 className="mt-6 font-display text-4xl leading-tight font-light sm:text-5xl">Complete your reservation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Your suite, dates, guests, live inventory and final price are checked before payment. A booking is confirmed only after our server verifies the payment.
        </p>
        <div className="mt-8"><BookingWorkflow view={view} step={step} /></div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {view === "details" ? (
              <>
                <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
                  <p className="text-xs tracking-widest text-fg-muted uppercase">Step 7 of 12</p>
                  <h2 className="mt-1 font-display text-2xl font-medium">Guest details</h2>
                  <p className="mt-1 text-sm text-fg-muted">We will send your confirmation to this address.</p>
                  <div className="mt-6 space-y-4">
                    <Input label="Full name" autoComplete="name" error={errors.guestName?.message} {...register("guestName")} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Email" type="email" autoComplete="email" error={errors.guestEmail?.message} {...register("guestEmail")} />
                      <Input label="Phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" error={errors.guestPhone?.message} {...register("guestPhone")} />
                    </div>
                    <Textarea label="Address (optional)" placeholder="Street, city, state and postal code" className="min-h-20" error={errors.guestAddress?.message} {...register("guestAddress")} />
                    <Textarea label="Special requests (optional)" placeholder="Arriving late, dietary needs, or a celebration we should know about" error={errors.specialRequests?.message} {...register("specialRequests")} />
                  </div>
                </section>
                <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
                  <p className="text-sm text-fg-muted">Next, review your stay and final amount before opening payment.</p>
                  <Button type="submit" size="lg" className="mt-5 w-full">Review booking <ArrowRight className="size-4" /></Button>
                </section>
              </>
            ) : (
              <>
                <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
                  <p className="text-xs tracking-widest text-fg-muted uppercase">Step 8 of 12</p>
                  <h2 className="mt-1 font-display text-2xl font-medium">Review your booking</h2>
                  <p className="mt-1 text-sm text-fg-muted">Please check these details before continuing to Razorpay.</p>
                  <dl className="mt-6 grid gap-5 border-t border-border-base pt-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs tracking-wider text-fg-muted uppercase">Guest</dt>
                      <dd className="mt-1 text-sm font-medium">{guest?.guestName}</dd>
                      <dd className="mt-1 text-sm text-fg-muted">{guest?.guestEmail}</dd>
                      <dd className="mt-1 text-sm text-fg-muted">{guest?.guestPhone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs tracking-wider text-fg-muted uppercase">Stay</dt>
                      <dd className="mt-1 text-sm font-medium">{room.name}</dd>
                      <dd className="mt-1 text-sm text-fg-muted">{formatDate(stay.checkIn)} to {formatDate(stay.checkOut)}</dd>
                      <dd className="mt-1 text-sm text-fg-muted">{stay.nights} {stay.nights === 1 ? "night" : "nights"} · {stay.rooms} {stay.rooms === 1 ? "room" : "rooms"} · {stay.adults + stay.children} guests</dd>
                    </div>
                    {guest?.specialRequests && <div className="sm:col-span-2"><dt className="text-xs tracking-wider text-fg-muted uppercase">Special requests</dt><dd className="mt-1 text-sm text-fg-muted">{guest.specialRequests}</dd></div>}
                    {guest?.guestAddress && <div className="sm:col-span-2"><dt className="text-xs tracking-wider text-fg-muted uppercase">Address</dt><dd className="mt-1 text-sm text-fg-muted">{guest.guestAddress}</dd></div>}
                  </dl>
                  <button type="button" onClick={() => setView("details")} disabled={busy} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:underline disabled:opacity-50 dark:text-forest-400"><ArrowLeft className="size-4" /> Edit guest details</button>
                </section>
                <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8">
                  <p className="text-xs tracking-widest text-fg-muted uppercase">Steps 9–10 of 12</p>
                  <h2 className="mt-1 font-display text-2xl font-medium">Secure payment</h2>
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bg-subtle p-4">
                    <Info className="mt-0.5 size-4 shrink-0 text-forest-600 dark:text-forest-400" />
                    <p className="text-sm leading-relaxed text-fg-muted">Razorpay handles card, UPI, net banking and wallet payments. A popup success is not a confirmation: we verify the gateway signature on our server first.</p>
                  </div>
                  <Button type="submit" size="lg" loading={busy} className="mt-6 w-full"><CreditCard className="size-4" /> Pay {formatCurrency(totalAmount)}</Button>
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-fg-muted"><ShieldCheck className="size-3.5" /> Eligible bookings can be cancelled before the check-in date.</p>
                </section>
              </>
            )}
          </form>

          <aside className="lg:relative">
            <div className="rounded-3xl border border-border-base bg-bg-elevated p-6 lg:sticky lg:top-28">
              <div className="flex gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl"><Image src={room.images?.[0]?.url ?? FALLBACK} alt={room.name} fill sizes="80px" className="object-cover" /></div>
                <div className="min-w-0"><h2 className="font-display text-xl leading-tight font-medium">{room.name}</h2><p className="mt-1 text-xs text-fg-muted">{room.bedType} bed</p></div>
              </div>
              <dl className="mt-6 space-y-3 border-t border-border-base pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-fg-muted">Check in</dt><dd className="font-medium">{formatDate(stay.checkIn)}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-muted">Check out</dt><dd className="font-medium">{formatDate(stay.checkOut)}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-muted">Guests</dt><dd className="font-medium">{stay.adults} {stay.adults === 1 ? "adult" : "adults"}{stay.children > 0 && `, ${stay.children} ${stay.children === 1 ? "child" : "children"}`}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-muted">Rooms</dt><dd className="font-medium">{stay.rooms}</dd></div>
              </dl>
              <dl className="mt-5 space-y-2.5 border-t border-border-base pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-fg-muted">{formatCurrency(nightlyRate)} × {stay.nights} {stay.nights === 1 ? "night" : "nights"}</dt><dd>{formatCurrency(roomTotal)}</dd></div>
                {fees.map((fee) => <div key={fee.label} className="flex justify-between"><dt className="text-fg-muted">{fee.label}</dt><dd>{formatCurrency(fee.amount)}</dd></div>)}
                <div className="flex justify-between"><dt className="text-fg-muted">Taxes &amp; fees</dt><dd>{formatCurrency(taxes)}</dd></div>
                <div className="flex justify-between border-t border-border-base pt-3 text-lg font-medium"><dt>Total</dt><dd>{formatCurrency(totalAmount)}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
