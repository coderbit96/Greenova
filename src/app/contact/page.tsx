import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Greenova team for reservations, events and enquiries.",
};

const details = [
  { Icon: MapPin, label: "Address", value: "Canopy Ridge Road\nCoorg, Karnataka 571201" },
  { Icon: Phone, label: "Reservations", value: "+91 1800 425 000" },
  { Icon: Mail, label: "Email", value: "stay@greenova.com" },
  { Icon: Clock, label: "Front desk", value: "Open 24 hours, every day" },
];

export default function ContactPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 dark:text-brass-300 uppercase">
            Get in touch
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            We would love to hear from you
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            Planning a stay, an event or something out of the ordinary? Our team replies
            within one working day.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-3xl bg-bg-subtle p-8">
              <h2 className="font-display text-2xl font-medium">Visit us</h2>
              <dl className="mt-8 space-y-7">
                {details.map(({ Icon, label, value }) => (
                  <div key={label} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-900/60 dark:text-forest-300">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <dt className="text-xs tracking-wider text-fg-muted uppercase">{label}</dt>
                      <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-fg">
                        {value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
