import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { User, CalendarCheck } from "lucide-react";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
          <aside>
            <p className="text-xs tracking-widest text-fg-muted uppercase">Account</p>
            <p className="mt-2 truncate font-display text-2xl font-medium">
              {session.user.name}
            </p>
            <nav className="mt-6 flex gap-2 lg:flex-col">
              <Link
                href="/account"
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
              >
                <User className="size-4" />
                Profile
              </Link>
              <Link
                href="/account/bookings"
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
              >
                <CalendarCheck className="size-4" />
                My Bookings
              </Link>
            </nav>
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
