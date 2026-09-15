import Link from "next/link";
import { Leaf, MapPin, Phone, Mail } from "lucide-react";
import { getHotelSettings } from "@/services/settings.service";

// lucide-react dropped brand marks, so the social glyphs are inlined.
const socials = [
  {
    label: "Instagram",
    path: "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.44.43.7.83.92 1.4.17.4.37 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.22.6-.48 1-.92 1.4-.42.44-.82.7-1.4.92-.4.17-1 .37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.48-1.4-.92-.44-.42-.7-.82-.92-1.4-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.48-1 .92-1.4.42-.44.82-.7 1.4-.92.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 5.1a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.75a3.05 3.05 0 1 1 0-6.1 3.05 3.05 0 0 1 0 6.1Zm5.99-7.94a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z",
  },
  {
    label: "Facebook",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z",
  },
  {
    label: "X",
    path: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z",
  },
];

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/rooms", label: "Rooms & Suites" },
      { href: "/availability", label: "Check Availability" },
      { href: "/dining", label: "Dining" },
      { href: "/amenities", label: "Experiences" },
      { href: "/gallery", label: "Gallery" },
      { href: "/offers", label: "Offers" },
      { href: "/about", label: "Our Story" },
    ],
  },
  {
    title: "Guests",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/account/bookings", label: "My Bookings" },
      { href: "/faq", label: "FAQ" },
      { href: "/policies", label: "Policies" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Sign In" },
    ],
  },
];

export default async function Footer() {
  const settings = await getHotelSettings().catch(() => null) as null | {
    hotel?: { name?: string; email?: string; phone?: string; address?: string; socialLinks?: Record<string, string> };
  };
  const hotel = settings?.hotel ?? {};
  const name = hotel.name || "Greenova";
  const address = hotel.address || "Canopy Ridge Road, Coorg, Karnataka 571201";
  const phone = hotel.phone || "+91 1800 425 000";
  const email = hotel.email || "stay@greenova.com";
  const socialLinks = hotel.socialLinks ?? {};
  return (
    <footer data-site-footer className="mt-auto border-t border-border-base bg-forest-950 text-forest-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-forest-600">
                <Leaf className="size-4 text-white" strokeWidth={2} />
              </span>
              <span className="font-display text-2xl font-semibold text-white">{name}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-forest-300">
              A rainforest sanctuary where considered luxury meets the quiet of the canopy.
              Rest deeply. Wake gently.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ label, path }) => (
                <a
                  key={label}
                  href={socialLinks[label.toLowerCase()] || "#"}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full bg-forest-900 text-forest-300 transition-colors hover:bg-forest-700 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold tracking-widest text-brass-300 uppercase">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-forest-300 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-widest text-brass-300 uppercase">
              Reach Us
            </h3>
            <ul className="space-y-3 text-sm text-forest-300">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-forest-500" />
                <span className="whitespace-pre-line">{address.replace(", ", "\n")}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-forest-500" />
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-white">
                  {phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-forest-500" />
                <a href={`mailto:${email}`} className="transition-colors hover:text-white">
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-forest-900 pt-8 sm:flex-row">
          <p className="text-xs text-forest-400">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-forest-400">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Stay
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
