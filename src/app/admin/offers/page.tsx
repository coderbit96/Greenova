import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Ticket } from "lucide-react";
import { auth } from "@/lib/auth";
import { listCoupons } from "@/services/coupon.service";
import { formatCurrency, formatDate } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Offers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Offers are backed by the same validated Coupon records used at checkout.
 * This avoids maintaining a second, client-controlled promotion system.
 */
export default async function OffersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/offers");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const coupons = await listCoupons();
  const now = new Date();
  const liveOffers = coupons.filter(
    (coupon) => coupon.active && coupon.startDate <= now && coupon.expiryDate >= now,
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Offers</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
            Live promotions are validated server-side at checkout through the coupon engine.
          </p>
        </div>
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800"
        >
          <Ticket className="size-4" />
          Manage offers
        </Link>
      </div>

      {liveOffers.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center">
          <h2 className="font-display text-2xl font-medium">No live offers</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Create an active coupon with a current validity window to publish an offer.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {liveOffers.map((offer) => (
            <li key={String(offer._id)} className="rounded-3xl border border-border-base bg-bg-elevated p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-lg font-semibold tracking-wide text-forest-700 dark:text-forest-300">
                  {offer.code}
                </p>
                <Badge tone="success">Live</Badge>
              </div>
              <p className="mt-4 font-display text-3xl font-light">
                {offer.type === "PERCENTAGE" ? `${offer.value}% off` : `${formatCurrency(offer.value)} off`}
              </p>
              <p className="mt-2 text-sm text-fg-muted">
                {(offer.minimumBookingAmount ?? 0) > 0
                  ? `On stays from ${formatCurrency(offer.minimumBookingAmount ?? 0)}`
                  : "No minimum stay value"}
              </p>
              <p className="mt-4 text-xs text-fg-muted">
                Valid through {formatDate(offer.expiryDate)} · {offer.usageCount}
                {offer.usageLimit ? `/${offer.usageLimit}` : ""} redemptions
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
