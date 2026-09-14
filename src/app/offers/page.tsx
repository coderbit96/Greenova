import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Check } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Offers",
  description:
    "Seasonal rates, longer-stay savings and packages at Greenova. No resort fees, ever.",
};

const offers = [
  {
    tag: "Stay longer",
    title: "The Fourth Night",
    saving: "25% off",
    body: "Book three nights and the fourth is a quarter of the price. Book seven and the last two are free. The longer you stay the less each night costs, because the hardest part of hospitality is the arrival.",
    includes: [
      "Applies to every room type",
      "Combines with the spa credit",
      "No minimum notice",
    ],
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1400&auto=format&fit=crop",
    featured: true,
  },
  {
    tag: "Monsoon",
    title: "Green Season",
    saving: "From ₹8,900",
    body: "June to September is when the estate is at its most alive and its least crowded. The mist sits in the valley until noon and the coffee flowers. Rates drop by up to forty percent.",
    includes: [
      "All meals included",
      "Daily spa treatment for two",
      "Flexible cancellation to 24 hours",
    ],
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1400&auto=format&fit=crop",
    featured: false,
  },
  {
    tag: "Two people",
    slug: "weekend-getaway",
    title: "The Long Weekend",
    saving: "Spa included",
    body: "Friday to Monday in a Canopy Suite, with the full spa circuit, a private dinner on the terrace and a guided walk to the ridge at sunrise. Built for people who need to be somewhere else by Tuesday.",
    includes: [
      "Three nights, Friday to Monday",
      "Private terrace dinner for two",
      "Late checkout at 2pm",
    ],
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1400&auto=format&fit=crop",
    featured: false,
  },
];

export default function OffersPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Rates &amp; Packages
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Offers
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            Every rate already includes breakfast, the spa circuit and the morning walk.
            There is no resort fee and there never has been.
          </p>
        </Reveal>

        <div className="mt-16 space-y-8">
          {offers.map((offer, i) => (
            <Reveal key={offer.title} delay={i * 0.08}>
              <article className="grid overflow-hidden rounded-[2rem] border border-border-base bg-bg-elevated lg:grid-cols-[1fr_1.1fr]">
                <div className="relative aspect-4/3 lg:aspect-auto lg:min-h-[340px]">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  {offer.featured && (
                    <span className="absolute top-5 left-5">
                      <Badge tone="brass">Most booked</Badge>
                    </span>
                  )}
                </div>

                <div className="flex flex-col p-8 sm:p-10">
                  <p className="text-xs tracking-wider text-brass-600 uppercase dark:text-brass-300">
                    {offer.tag}
                  </p>
                  <h2 className="mt-3 font-display text-3xl leading-tight font-light sm:text-4xl">
                    {offer.title}
                  </h2>
                  <p className="mt-2 font-display text-2xl font-medium text-forest-700 dark:text-forest-400">
                    {offer.saving}
                  </p>

                  <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
                    {offer.body}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {offer.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-fg-muted">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest-50 dark:bg-forest-900/60">
                          <Check className="size-3 text-forest-600 dark:text-forest-400" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    <LinkButton href={offer.slug ? `/offers/${offer.slug}` : "/availability"}>
                      <CalendarDays className="size-4" />
                      {offer.slug ? "Explore offer" : "Check dates"}
                    </LinkButton>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 rounded-[2rem] bg-bg-subtle px-8 py-14">
          <h2 className="font-display text-2xl font-medium">The small print, in plain words</h2>
          <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-fg-muted">
            <li>
              Offers apply to new bookings only and cannot be applied retrospectively to a
              stay already reserved.
            </li>
            <li>
              One offer per booking. Where two would apply, we quote whichever is cheaper
              for you.
            </li>
            <li>
              Rates are per room per night, include all taxes shown at checkout, and are
              held for the duration of your stay.
            </li>
            <li>
              Free cancellation up to 48 hours before arrival on every rate except Green
              Season, which is 24 hours.
            </li>
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
