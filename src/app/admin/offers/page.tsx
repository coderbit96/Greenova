import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminStub from "@/components/admin/AdminStub";

export const metadata: Metadata = {
  title: "Offers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/offers");

  return (
    <AdminStub
      title="Offers"
      description="Seasonal packages and promotional rates shown on the public site."
      requires={["Offer"]}
    />
  );
}
