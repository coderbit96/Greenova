"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User, LogOut, LayoutDashboard, CalendarCheck, Leaf } from "lucide-react";
import { cn } from "@/utils";
import { LinkButton } from "@/components/ui/Button";

const links = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/availability", label: "Availability" },
  { href: "/dining", label: "Dining" },
  { href: "/amenities", label: "Amenities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/offers", label: "Offers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  // Rewrites/proxies can make usePathname() differ between SSR and the first
  // browser render. Defer route-dependent decoration until hydration so the
  // initial markup is identical on both sides.
  const [hydratedPath, setHydratedPath] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHydratedPath(pathname);
      setMobileOpen(false);
      setMenuOpen(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  // Transparent over the hero, solid once scrolled.
  const isHome = hydratedPath === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen && !menuOpen) return;
    if (mobileOpen) mobileCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, menuOpen]);

  return (
    <>
      <header
        data-site-nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          transparent ? "bg-transparent py-5" : "glass border-b border-border-base py-3 shadow-sm",
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span
              className={cn(
                "grid size-9 place-items-center rounded-full transition-colors",
                transparent ? "bg-white/15 backdrop-blur" : "bg-forest-700 dark:bg-forest-600",
              )}
            >
              <Leaf className="size-4 text-white" strokeWidth={2} />
            </span>
            <span
              className={cn(
                "font-display text-2xl font-semibold tracking-tight transition-colors",
                transparent ? "text-white" : "text-fg",
              )}
            >
              Greenova
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = hydratedPath === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      transparent
                        ? "text-white/85 hover:text-white"
                        : "text-fg-muted hover:text-fg",
                      active && (transparent ? "text-white" : "text-forest-700 dark:text-forest-300"),
                    )}
                  >
                    {l.label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className={cn(
                          "absolute inset-x-4 -bottom-0.5 h-px",
                          transparent ? "bg-white" : "bg-forest-600 dark:bg-forest-400",
                        )}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {status === "loading" ? (
              <div className="size-9 animate-pulse rounded-full bg-fg-muted/20" />
            ) : session?.user ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-controls="account-menu"
                  className={cn(
                    "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors",
                    transparent
                      ? "text-white hover:bg-white/15"
                      : "border border-border-base text-fg hover:bg-bg-subtle",
                  )}
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-7 place-items-center rounded-full bg-forest-600 text-xs font-semibold text-white">
                      {session.user.name?.[0]?.toUpperCase() ?? "G"}
                    </span>
                  )}
                  <span className="max-w-24 truncate">{session.user.name?.split(" ")[0]}</span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close account menu" />
                      <motion.div
                        id="account-menu"
                        role="menu"
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-border-base bg-bg-elevated shadow-xl"
                      >
                        <div className="border-b border-border-base px-4 py-3">
                          <p className="truncate text-sm font-medium text-fg">{session.user.name}</p>
                          <p className="truncate text-xs text-fg-muted">{session.user.email}</p>
                        </div>
                        <MenuLink href="/account" icon={<User className="size-4" />}>
                          Account
                        </MenuLink>
                        <MenuLink href="/account/bookings" icon={<CalendarCheck className="size-4" />}>
                          My Bookings
                        </MenuLink>
                        {session.user.role === "admin" && (
                          <MenuLink href="/admin" icon={<LayoutDashboard className="size-4" />}>
                            Admin Dashboard
                          </MenuLink>
                        )}
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-2.5 border-t border-border-base px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <LogOut className="size-4" />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  href="/login"
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    transparent ? "text-white/90 hover:text-white" : "text-fg-muted hover:text-fg",
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    transparent ? "text-white/90 hover:text-white" : "text-fg-muted hover:text-fg",
                  )}
                >
                  Register
                </Link>
                <LinkButton href="/availability" size="sm" variant={transparent ? "secondary" : "primary"}>
                  Book Now
                </LinkButton>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(
                "grid size-11 place-items-center rounded-full transition-colors lg:hidden",
                transparent ? "text-white hover:bg-white/15" : "text-fg hover:bg-bg-subtle",
              )}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-bg p-6 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-2xl font-semibold">Greenova</span>
                <button
                  ref={mobileCloseRef}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="grid size-11 place-items-center rounded-full hover:bg-bg-subtle"
                >
                  <X className="size-5" />
                </button>
              </div>

              <ul className="flex flex-col gap-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        hydratedPath === l.href
                          ? "bg-forest-50 text-forest-800 dark:bg-forest-900/40 dark:text-forest-200"
                          : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-2 border-t border-border-base pt-6">
                {session?.user ? (
                  <>
                    <LinkButton href="/availability" className="mb-2 w-full">
                      Book Now
                    </LinkButton>
                    <Link
                      href="/account"
                      className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-bg-subtle"
                    >
                      Account
                    </Link>
                    <Link
                      href="/account/bookings"
                      className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-bg-subtle"
                    >
                      My Bookings
                    </Link>
                    {session.user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-bg-subtle"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <LinkButton href="/login" variant="outline" className="w-full">
                      Login
                    </LinkButton>
                    <LinkButton href="/register" variant="outline" className="w-full">
                      Register
                    </LinkButton>
                    <LinkButton href="/availability" className="w-full">
                      Book Now
                    </LinkButton>
                  </>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg transition-colors hover:bg-bg-subtle"
    >
      {icon}
      {children}
    </Link>
  );
}
