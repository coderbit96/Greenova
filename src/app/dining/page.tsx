import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Leaf, Wine, Users } from "lucide-react";
import Reveal, { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Dining",
  description:
    "One menu, rewritten daily around whatever the kitchen garden gives up that morning. Dining at Greenova.",
};

const venues = [
  {
    name: "The Estate Table",
    hours: "Dinner, 7pm – 10pm",
    body: "Nine courses if you have the evening, three if you do not. The menu is written at four each afternoon, once the garden has been walked and the day's catch has come up from the coast. There is no printed wine list — tell the sommelier what you are enjoying and something will appear.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1400&auto=format&fit=crop",
    note: "Reservation required · Included in full-board rates",
  },
  {
    name: "The Verandah",
    hours: "All day, 7am – 6pm",
    body: "Breakfast runs until whenever you surface. Eggs from the estate, bread baked at four, coffee grown four hundred metres downhill and roasted on site. Lunch is lighter and mostly cold — salads from the garden, cured fish, fruit picked that morning.",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop",
    note: "No reservation needed · Breakfast included in every rate",
  },
  {
    name: "The Cellar",
    hours: "6pm – midnight",
    body: "Cut into the hillside below the main house, where the temperature holds at fifteen degrees without any help from us. Four hundred labels, a long zinc bar and a fire that is lit from October. The bartender makes exactly one cocktail well and will tell you so.",
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1400&auto=format&fit=crop",
    note: "Adults only after 9pm",
  },
];

const principles = [
  {
    Icon: Leaf,
    title: "Harvested at dawn",
    body: "The kitchen garden is walked at six. Whatever is ready decides the menu, not the other way around.",
  },
  {
    Icon: Clock,
    title: "Written daily",
    body: "No dish survives more than a week. If you return in a month you will not eat the same meal twice.",
  },
  {
    Icon: Wine,
    title: "Four hundred labels",
    body: "Weighted towards Indian and old-world producers, with a deep bench of things that pair with chilli.",
  },
  {
    Icon: Users,
    title: "Cooked for, not at",
    body: "Tell us what you cannot eat and the kitchen will simply cook around it. No separate menu, no fuss.",
  },
];

export default function DiningPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            The Kitchen
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Dining
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            The estate has fed itself for longer than it has taken guests. Most of what
            reaches your table was picked, caught or baked within a few hours of it.
          </p>
        </Reveal>

        {/* Venues */}
        <div className="mt-20 space-y-24 lg:space-y-32">
          {venues.map((venue, i) => (
            <Reveal key={venue.name}>
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden rounded-[2rem]">
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div>
                  <p className="text-xs tracking-wider text-brass-600 uppercase dark:text-brass-300">
                    {venue.hours}
                  </p>
                  <h2 className="mt-3 font-display text-4xl leading-tight font-light text-balance">
                    {venue.name}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
                    {venue.body}
                  </p>
                  <p className="mt-6 border-t border-border-base pt-5 text-sm text-fg-muted">
                    {venue.note}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Principles */}
        <section className="mt-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
              How the kitchen works
            </h2>
          </Reveal>

          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2">
            {principles.map(({ Icon, title, body }) => (
              <StaggerItem key={title}>
                <div className="flex h-full gap-5 rounded-3xl border border-border-base bg-bg-elevated p-8">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-900/60 dark:text-forest-300">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-medium">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <Reveal className="mt-24 rounded-[2rem] bg-bg-subtle px-8 py-16 text-center">
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Dietary needs are not a problem
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-fg-muted">
            Tell us when you book — there is a field for it at checkout — and the kitchen
            will plan around it rather than substituting at the table.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <LinkButton href="/availability" size="lg">
              Check Availability
            </LinkButton>
            <LinkButton href="/contact" size="lg" variant="outline">
              Ask the Kitchen
            </LinkButton>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
