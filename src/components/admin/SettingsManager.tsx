"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { updateHotelSettingsAction } from "@/actions/settings.actions";

type Settings = {
  hotel?: { name?: string; logo?: string; email?: string; phone?: string; address?: string; mapsLink?: string; timezone?: string; currency?: string; socialLinks?: Record<string, string> };
  booking?: { checkIn?: string; checkOut?: string; maxAdvanceDays?: number; minimumStayNights?: number; cancellationRules?: string };
  tax?: { taxPercent?: number; serviceChargePercent?: number };
  payment?: { razorpayEnabled?: boolean };
};

const inputClass = "mt-1 w-full rounded-xl border border-border-base bg-bg px-3 py-2.5 text-sm";
const labelClass = "block text-sm font-medium text-fg";

export default function SettingsManager({ settings }: { settings: Settings }) {
  const [saving, setSaving] = useState(false);
  const hotel = settings.hotel ?? {};
  const booking = settings.booking ?? {};
  const tax = settings.tax ?? {};
  const social = hotel.socialLinks ?? {};

  async function save(formData: FormData) {
    setSaving(true);
    const socialLinks = Object.fromEntries(
      ["instagram", "facebook", "x"].flatMap((name) => {
        const value = String(formData.get(`social-${name}`) ?? "").trim();
        return value ? [[name, value]] : [];
      }),
    );
    const result = await updateHotelSettingsAction({
      hotel: {
        name: String(formData.get("name") ?? ""), logo: String(formData.get("logo") ?? ""),
        email: String(formData.get("email") ?? ""), phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""), mapsLink: String(formData.get("mapsLink") ?? ""),
        timezone: String(formData.get("timezone") ?? ""), currency: String(formData.get("currency") ?? ""), socialLinks,
      },
      booking: {
        checkIn: String(formData.get("checkIn") ?? ""), checkOut: String(formData.get("checkOut") ?? ""),
        maxAdvanceDays: Number(formData.get("maxAdvanceDays")), minimumStayNights: Number(formData.get("minimumStayNights")),
        cancellationRules: String(formData.get("cancellationRules") ?? ""),
      },
      tax: { taxPercent: Number(formData.get("taxPercent")), serviceChargePercent: Number(formData.get("serviceChargePercent")) },
      payment: { razorpayEnabled: formData.get("razorpayEnabled") === "on" },
    });
    setSaving(false);
    if (result.ok) toast.success("Hotel settings saved.");
    else toast.error(result.error);
  }

  return <form action={save} className="mt-8 space-y-6">
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"><h2 className="font-display text-2xl font-medium">Hotel</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>Hotel name<input name="name" required defaultValue={hotel.name} className={inputClass}/></label>
      <label className={labelClass}>Contact email<input name="email" type="email" required defaultValue={hotel.email} className={inputClass}/></label>
      <label className={labelClass}>Phone<input name="phone" required defaultValue={hotel.phone} className={inputClass}/></label>
      <label className={labelClass}>Timezone<input name="timezone" required defaultValue={hotel.timezone} className={inputClass}/></label>
      <label className={labelClass}>Currency<input name="currency" required maxLength={3} defaultValue={hotel.currency} className={inputClass}/></label>
      <label className={labelClass}>Logo URL<input name="logo" type="url" defaultValue={hotel.logo} className={inputClass}/></label>
      <label className={`sm:col-span-2 ${labelClass}`}>Address<textarea name="address" required defaultValue={hotel.address} className={`${inputClass} min-h-24`}/></label>
      <label className={`sm:col-span-2 ${labelClass}`}>Maps link<input name="mapsLink" type="url" defaultValue={hotel.mapsLink} className={inputClass}/></label>
    </div></section>
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"><h2 className="font-display text-2xl font-medium">Booking & tax</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>Standard check-in<input name="checkIn" required defaultValue={booking.checkIn} className={inputClass}/></label>
      <label className={labelClass}>Standard check-out<input name="checkOut" required defaultValue={booking.checkOut} className={inputClass}/></label>
      <label className={labelClass}>Maximum advance days<input name="maxAdvanceDays" required type="number" min="1" max="730" defaultValue={booking.maxAdvanceDays} className={inputClass}/></label>
      <label className={labelClass}>Minimum stay (nights)<input name="minimumStayNights" required type="number" min="1" max="30" defaultValue={booking.minimumStayNights} className={inputClass}/></label>
      <label className={labelClass}>Tax (%)<input name="taxPercent" required type="number" min="0" max="100" step="0.01" defaultValue={tax.taxPercent} className={inputClass}/></label>
      <label className={labelClass}>Service charge (%)<input name="serviceChargePercent" required type="number" min="0" max="100" step="0.01" defaultValue={tax.serviceChargePercent} className={inputClass}/></label>
      <label className={`sm:col-span-2 ${labelClass}`}>Cancellation rules<textarea name="cancellationRules" required defaultValue={booking.cancellationRules} className={`${inputClass} min-h-28`}/></label>
    </div></section>
    <section className="rounded-3xl border border-border-base bg-bg-elevated p-6 sm:p-8"><h2 className="font-display text-2xl font-medium">Social & payment</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>Instagram URL<input name="social-instagram" type="url" defaultValue={social.instagram} className={inputClass}/></label>
      <label className={labelClass}>Facebook URL<input name="social-facebook" type="url" defaultValue={social.facebook} className={inputClass}/></label>
      <label className={labelClass}>X URL<input name="social-x" type="url" defaultValue={social.x} className={inputClass}/></label>
      <label className="mt-7 flex items-center gap-3 text-sm font-medium"><input name="razorpayEnabled" type="checkbox" defaultChecked={Boolean(settings.payment?.razorpayEnabled)} className="size-4 accent-forest-700"/> Razorpay enabled <span className="font-normal text-fg-muted">(keys are never displayed)</span></label>
    </div></section>
    <Button type="submit" loading={saving} size="lg">Save settings</Button>
  </form>;
}
