import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAmenities } from "@/services/content.service";
import { AdminAmenities } from "@/components/admin/ContentManagers";

export const metadata: Metadata = {
  title: "Amenities",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AmenitiesPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/amenities");

  return <AdminAmenities initial={await listAmenities()} />;
}
