import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listGallery } from "@/services/content.service";
import { AdminGallery } from "@/components/admin/ContentManagers";

export const metadata: Metadata = {
  title: "Gallery",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/gallery");

  return <AdminGallery initial={await listGallery()} />;
}
