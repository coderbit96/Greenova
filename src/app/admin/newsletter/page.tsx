import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listNewsletterSubscribers } from "@/services/newsletter.service";
import { formatDate } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/newsletter");

  const subscribers = await listNewsletterSubscribers() as unknown as Array<{ _id: string; email: string; status: "SUBSCRIBED" | "UNSUBSCRIBED"; subscribedAt: string }>;
  return <div><h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Newsletter</h1><p className="mt-3 text-sm text-fg-muted">{subscribers.filter((subscriber) => subscriber.status === "SUBSCRIBED").length} active subscribers.</p>{subscribers.length === 0 ? <p className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center text-sm text-fg-muted">No subscribers yet.</p> : <div className="mt-8 overflow-hidden rounded-3xl border border-border-base bg-bg-elevated"><table className="w-full text-sm"><thead className="bg-bg-subtle text-left text-xs tracking-wider text-fg-muted uppercase"><tr><th className="px-6 py-3 font-medium">Email</th><th className="px-6 py-3 font-medium">Subscribed</th><th className="px-6 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border-base">{subscribers.map((subscriber) => <tr key={subscriber._id}><td className="px-6 py-4 font-medium">{subscriber.email}</td><td className="px-6 py-4 text-fg-muted">{formatDate(subscriber.subscribedAt)}</td><td className="px-6 py-4 text-right"><Badge tone={subscriber.status === "SUBSCRIBED" ? "success" : "neutral"}>{subscriber.status === "SUBSCRIBED" ? "Subscribed" : "Unsubscribed"}</Badge></td></tr>)}</tbody></table></div>}</div>;
}
