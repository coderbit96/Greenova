import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listCoupons } from "@/services/coupon.service";
import { listAllRooms } from "@/services/room.service";
import AdminCoupons from "@/components/admin/AdminCoupons";

export const metadata: Metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/coupons");

  const [coupons, rooms] = await Promise.all([listCoupons(), listAllRooms()]);
  return <div><h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Coupons</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">Discount codes are validated and priced on the server during checkout. Browser totals are never trusted.</p><AdminCoupons coupons={coupons as never} rooms={rooms.map((room) => ({ _id: room._id, name: room.name }))} today={new Date().toISOString().slice(0, 10)} /></div>;
}
