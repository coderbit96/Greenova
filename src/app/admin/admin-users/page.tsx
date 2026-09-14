import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAdmins } from "@/services/user.service";
import { formatDate } from "@/utils";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Admin Users",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // Re-checked here, not only in the layout: layouts and pages render in
  // parallel, so a layout redirect cannot stop this page's queries.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/login?callbackUrl=/admin/admin-users");

  const admins = await listAdmins();

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-light sm:text-5xl">Admin Users</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
        Accounts holding the administrator role. Roles live on the user record and are
        verified server-side on every admin route, never in the browser alone.
      </p>

      <ul className="mt-8 space-y-3">
        {admins.map((a) => (
          <li
            key={a._id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border-base bg-bg-elevated p-6"
          >
            <div className="min-w-0">
              <p className="font-medium text-fg">{a.name}</p>
              <p className="truncate text-sm text-fg-muted">{a.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="brass">Administrator</Badge>
              <p className="text-xs whitespace-nowrap text-fg-muted">
                since {formatDate(a.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
