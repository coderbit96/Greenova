import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listDining } from "@/services/content.service";
import { AdminDining } from "@/components/admin/ContentManagers";

export const metadata: Metadata = {
  title: "Dining",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiningPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/dining");

  return <AdminDining initial={await listDining()} />;
}
