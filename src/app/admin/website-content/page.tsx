import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import WebsiteContentManager from "@/components/admin/WebsiteContentManager";
import { getHotelSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Website Content",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WebsiteContentPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/website-content");

  const settings = await getHotelSettings();
  const content = (settings as { content?: Record<string, unknown> }).content ?? {};
  return <div><h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Website Content</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">Publish key home, story and FAQ copy without a deployment.</p><WebsiteContentManager content={content as never} /></div>;
}
