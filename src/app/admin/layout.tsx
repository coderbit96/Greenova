import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { LayoutDashboard, BedDouble, CalendarCheck, ArrowLeft } from "lucide-react";

const nav = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/rooms", label: "Rooms", Icon: BedDouble },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=/admin");
  // Non-admins are sent home rather than shown a locked page.
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="pt-24 pb-24 lg:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[210px_1fr] lg:gap-12">
          <aside>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-fg"
            >
              <ArrowLeft className="size-3.5" />
              Back to site
            </Link>
            <p className="mt-4 font-display text-2xl font-medium">Admin</p>
            <nav className="mt-6 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {nav.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
