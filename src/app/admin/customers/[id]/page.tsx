import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAdminCustomerDetail } from "@/services/user.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge, { statusTone } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Customer Profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/customers");
  if (session.user.role !== "admin") redirect("/unauthorized");
  const { id } = await params;
  const customer = await getAdminCustomerDetail(id);
  if (!customer) notFound();

  return <div>
    <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Customers</Link>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-4xl font-light sm:text-5xl">{customer.user.name}</h1><p className="mt-2 text-sm text-fg-muted">{customer.user.email} · {customer.user.phone ?? "No phone on account"}</p></div><Badge tone="success">Active account</Badge></div>
    <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total spending" value={formatCurrency(customer.totalSpend)} /><Metric label="Completed stays" value={String(customer.completedStays)} /><Metric label="Cancelled stays" value={String(customer.cancelledStays)} /><Metric label="Joined" value={formatDate(customer.user.createdAt)} /></dl>
    <section className="mt-10 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated"><div className="p-6"><h2 className="font-display text-2xl font-medium">Booking history</h2></div>{customer.bookings.length === 0 ? <p className="border-t border-border-base px-6 py-12 text-center text-sm text-fg-muted">No bookings for this customer.</p> : <div className="overflow-x-auto border-t border-border-base"><table className="w-full text-sm"><thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase"><tr><th className="px-6 py-3">Reference</th><th className="px-6 py-3">Room</th><th className="px-6 py-3">Stay</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-border-base">{customer.bookings.map((booking) => <tr key={booking._id}><td className="px-6 py-4 font-medium">{booking.reference}</td><td className="px-6 py-4">{booking.room?.name ?? "Archived room"}</td><td className="px-6 py-4 whitespace-nowrap text-fg-muted">{formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}</td><td className="px-6 py-4"><Badge tone={statusTone(booking.status)}>{booking.status}</Badge></td><td className="px-6 py-4 text-right font-medium">{formatCurrency(booking.totalAmount)}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl border border-border-base bg-bg-elevated p-5"><dt className="text-xs tracking-wider text-fg-muted uppercase">{label}</dt><dd className="mt-2 font-display text-2xl">{value}</dd></div>; }
