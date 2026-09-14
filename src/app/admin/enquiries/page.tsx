import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listEnquiries } from "@/services/content.service";
import { AdminEnquiries } from "@/components/admin/ContentManagers";

export const metadata: Metadata = {
  title: "Contact Enquiries",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/enquiries");

  return <AdminEnquiries initial={await listEnquiries()} />;
}
