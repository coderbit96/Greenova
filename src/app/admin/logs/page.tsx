import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAdminLogs } from "@/services/admin-log.service";
import { formatDate } from "@/utils";

export const metadata: Metadata = {
  title: "Logs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  // Re-checked here, not only in the layout: pages and layouts render in
  // parallel, so a layout redirect cannot stop this page rendering.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/logs");

  const logs = await listAdminLogs() as unknown as Array<{ _id: string; action: string; targetType: string; targetId?: string; detail?: string; createdAt: string; admin?: { name?: string; email?: string } }>;
  return <div><h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Logs</h1><p className="mt-3 text-sm text-fg-muted">Recent administrative activity for accountability.</p>{logs.length === 0 ? <p className="mt-10 rounded-3xl border border-dashed border-border-base py-16 text-center text-sm text-fg-muted">No administrative actions recorded yet.</p> : <ul className="mt-8 divide-y divide-border-base overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">{logs.map((log) => <li key={log._id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"><div><p className="text-sm font-medium">{log.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-fg-muted">{log.admin?.name ?? log.admin?.email ?? "Administrator"} · {log.targetType}{log.targetId ? ` · ${log.targetId}` : ""}{log.detail ? ` · ${log.detail}` : ""}</p></div><time className="text-xs text-fg-muted">{formatDate(log.createdAt)}</time></li>)}</ul>}</div>;
}
