import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SettingsManager from "@/components/admin/SettingsManager";
import { getHotelSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/settings");

  const settings = await getHotelSettings();
  return <div><h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Settings</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">Hotel-wide configuration for contact details, booking policies, taxes and payment availability. Private gateway credentials remain in environment variables.</p><SettingsManager settings={settings as never} /></div>;
}
