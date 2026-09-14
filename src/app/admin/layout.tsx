import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Layers,
  Users,
  CalendarSearch,
  CalendarRange,
  CreditCard,
  RotateCcw,
  Ticket,
  Tag,
  Star,
  Images,
  Sparkles,
  UtensilsCrossed,
  Quote,
  Mail,
  Send,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  ScrollText,
  ArrowLeft,
} from "lucide-react";
import { auth } from "@/lib/auth";
import AdminSignOut from "@/components/admin/AdminSignOut";

/**
 * Admin navigation.
 *
 * `live` marks a section backed by a real MongoDB collection. The rest are
 * present so the navigation matches the specified structure, but they say
 * plainly that no data exists behind them rather than showing invented rows.
 */
const SECTIONS = [
  {
    heading: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, live: true },
      { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck, live: true },
      { href: "/admin/rooms", label: "Rooms", Icon: BedDouble, live: true },
      { href: "/admin/room-types", label: "Room Types", Icon: Layers, live: true },
      { href: "/admin/customers", label: "Customers", Icon: Users, live: true },
      { href: "/admin/availability", label: "Availability", Icon: CalendarSearch, live: true },
      { href: "/admin/calendar", label: "Calendar", Icon: CalendarRange, live: true },
    ],
  },
  {
    heading: "Finance",
    items: [
      { href: "/admin/payments", label: "Payments", Icon: CreditCard, live: true },
      { href: "/admin/refunds", label: "Refunds", Icon: RotateCcw, live: true },
      { href: "/admin/coupons", label: "Coupons", Icon: Ticket, live: true },
      { href: "/admin/offers", label: "Offers", Icon: Tag, live: false },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/reviews", label: "Reviews", Icon: Star, live: true },
      { href: "/admin/gallery", label: "Gallery", Icon: Images, live: true },
      { href: "/admin/amenities", label: "Amenities", Icon: Sparkles, live: true },
      { href: "/admin/dining", label: "Dining", Icon: UtensilsCrossed, live: true },
      { href: "/admin/testimonials", label: "Testimonials", Icon: Quote, live: false },
      { href: "/admin/website-content", label: "Website Content", Icon: FileText, live: false },
    ],
  },
  {
    heading: "Engagement",
    items: [
      { href: "/admin/enquiries", label: "Contact Enquiries", Icon: Mail, live: true },
      { href: "/admin/newsletter", label: "Newsletter", Icon: Send, live: true },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/reports", label: "Reports", Icon: BarChart3, live: true },
      { href: "/admin/admin-users", label: "Admin Users", Icon: ShieldCheck, live: true },
      { href: "/admin/settings", label: "Settings", Icon: Settings, live: true },
      { href: "/admin/logs", label: "Logs", Icon: ScrollText, live: true },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=/admin");
  // Non-admins are sent home rather than shown a locked page.
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="pt-24 pb-24 lg:pt-28">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-fg"
            >
              <ArrowLeft className="size-3.5" />
              Back to site
            </Link>

            <div className="mt-4">
              <p className="font-display text-2xl font-medium">Admin</p>
              <p className="mt-0.5 truncate text-xs text-fg-muted">{session.user.email}</p>
            </div>

            {/* Horizontal scroll on small screens keeps 24 items usable. */}
            <nav className="mt-6 max-h-none overflow-x-auto lg:max-h-[calc(100vh-14rem)] lg:overflow-x-visible lg:overflow-y-auto lg:pr-2">
              <div className="flex gap-6 lg:flex-col lg:gap-5">
                {SECTIONS.map((section) => (
                  <div key={section.heading} className="shrink-0">
                    <p className="mb-2 hidden text-[0.65rem] font-medium tracking-widest text-fg-muted uppercase lg:block">
                      {section.heading}
                    </p>
                    <ul className="flex gap-2 lg:flex-col lg:gap-0.5">
                      {section.items.map(({ href, label, Icon, live }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="whitespace-nowrap">{label}</span>
                            {!live && (
                              <span
                                title="No data behind this section yet"
                                className="ml-auto hidden size-1.5 shrink-0 rounded-full bg-fg-muted/40 lg:block"
                              />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="shrink-0 lg:mt-2 lg:border-t lg:border-border-base lg:pt-4">
                  <AdminSignOut />
                </div>
              </div>
            </nav>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
