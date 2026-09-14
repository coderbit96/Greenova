"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

type Coupon = { _id: string; code: string; type: "PERCENTAGE" | "FIXED"; value: number; minimumBookingAmount?: number; maximumDiscount?: number; startDate: string; expiryDate: string; usageLimit?: number; usageCount: number; perUserLimit?: number; roomRestrictions: string[]; active: boolean };
type Room = { _id: string; name: string };
const input = "rounded-xl border border-border-base bg-bg px-3 py-2.5 text-sm";

export default function AdminCoupons({ coupons, rooms, today }: { coupons: Coupon[]; rooms: Room[]; today: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function create(formData: FormData) {
    setBusy(true);
    const response = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: formData.get("code"), type: formData.get("type"), value: Number(formData.get("value")), minimumBookingAmount: formData.get("minimumBookingAmount") ? Number(formData.get("minimumBookingAmount")) : undefined, maximumDiscount: formData.get("maximumDiscount") ? Number(formData.get("maximumDiscount")) : undefined, startDate: formData.get("startDate"), expiryDate: formData.get("expiryDate"), usageLimit: formData.get("usageLimit") ? Number(formData.get("usageLimit")) : undefined, perUserLimit: formData.get("perUserLimit") ? Number(formData.get("perUserLimit")) : undefined, roomRestrictions: formData.getAll("roomRestrictions"), active: true }) });
    const data = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { toast.error(data.error ?? "Could not create coupon."); return; }
    toast.success("Coupon created."); (document.activeElement as HTMLElement | null)?.blur(); router.refresh();
  }
  async function toggle(coupon: Coupon) {
    setBusy(true); const response = await fetch(`/api/admin/coupons/${coupon._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !coupon.active }) }); setBusy(false);
    if (!response.ok) { toast.error("Could not update coupon."); return; } toast.success(coupon.active ? "Coupon disabled." : "Coupon enabled."); router.refresh();
  }
  return <section><form action={create} className="mt-8 grid gap-3 rounded-3xl border border-border-base bg-bg-elevated p-5 sm:grid-cols-2 lg:grid-cols-4"><input name="code" required placeholder="GREENOVA10" className={input}/><select name="type" className={input}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed (paise)</option></select><input name="value" required min="1" type="number" placeholder="Value" className={input}/><input name="minimumBookingAmount" min="0" type="number" placeholder="Minimum amount (paise)" className={input}/><input name="maximumDiscount" min="0" type="number" placeholder="Max discount (paise)" className={input}/><input name="startDate" required type="date" defaultValue={today} className={input}/><input name="expiryDate" required type="date" className={input}/><input name="usageLimit" min="1" type="number" placeholder="Total usage limit" className={input}/><input name="perUserLimit" min="1" type="number" placeholder="Per-user limit" className={input}/><select name="roomRestrictions" multiple className={`${input} min-h-24`} aria-label="Restrict to rooms">{rooms.map((room) => <option value={room._id} key={room._id}>{room.name}</option>)}</select><div className="flex items-center"><Button type="submit" loading={busy}>Create coupon</Button></div></form><p className="mt-3 text-xs text-fg-muted">Amounts are stored in paise. Leave room restriction blank to apply to every room.</p><div className="mt-8 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated"><table className="w-full text-sm"><thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase"><tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Discount</th><th className="px-5 py-3">Usage</th><th className="px-5 py-3">Validity</th><th className="px-5 py-3 text-right">Status</th></tr></thead><tbody className="divide-y divide-border-base">{coupons.map((coupon) => <tr key={coupon._id}><td className="px-5 py-4 font-medium">{coupon.code}</td><td className="px-5 py-4">{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `₹${coupon.value / 100}`}</td><td className="px-5 py-4">{coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</td><td className="px-5 py-4 text-fg-muted">{coupon.startDate.slice(0, 10)} – {coupon.expiryDate.slice(0, 10)}</td><td className="px-5 py-4 text-right"><Button size="sm" variant="outline" disabled={busy} onClick={() => void toggle(coupon)}>{coupon.active ? "Disable" : "Enable"}</Button></td></tr>)}</tbody></table>{coupons.length === 0 && <p className="p-10 text-center text-sm text-fg-muted">No coupons created yet.</p>}</div></section>;
}
