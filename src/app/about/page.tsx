import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Greenova began as a coffee estate in the hills of Coorg. Read how a working plantation became a rainforest retreat.",
};

const milestones = [
  {
    year: "2009",
    title: "The estate",
    body: "Forty-eight acres of neglected coffee were bought at auction. The first year was spent doing nothing but walking the land.",
  },
  {
    year: "2013",
    title: "First six rooms",
    body: "Built on stilts to avoid cutting roots, from timber milled on site. Three of those original suites are still in service.",
  },
  {
    year: "2017",
    title: "The spring",
    body: "A survey found the spring that now feeds the spa and the kitchen. Everything downhill of it was redesigned around it.",
  },
  {
    year: "2024",
    title: "Carbon negative",
    body: "Solar, biogas and forty thousand replanted native saplings put the estate permanently in the black.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative flex min-h-[70svh] items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/35 to-forest-950/50" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-300 uppercase">
              Our Story
            </p>
            <h1 className="max-w-3xl font-display text-5xl leading-tight font-light text-balance text-white sm:text-6xl lg:text-7xl">
              We kept the trees and built around them
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="space-y-6 text-lg leading-relaxed text-pretty text-fg-muted">
            <p className="text-2xl leading-relaxed text-fg">
              Greenova was a coffee estate before it was anything else, and in most of the
              ways that matter it still is.
            </p>
            <p>
              The plantation had been left alone for the better part of a decade when we
              found it. The forest had begun taking it back — silver oak through the
              terraces, hornbills in the canopy, a leopard that the neighbours insisted was
              a rumour until the camera traps said otherwise.
            </p>
            <p>
              The obvious move was to clear and start again. Instead we spent a year mapping
              every tree over six inches, and then designed twenty-four rooms into the gaps
              between them. Not one was felled. The buildings sit on stilts because the root
              systems came first, and the paths bend because the trees would not.
            </p>
            <p>
              The coffee is still harvested. The kitchen garden feeds the restaurant. The
              spring feeds the spa. Guests arrive expecting a hotel and leave describing
              something closer to a household — which is, more or less, what we were
              aiming for.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Timeline */}
      <section className="bg-bg-subtle py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-4xl leading-tight font-light sm:text-5xl">
              Fifteen years, slowly
            </h2>
          </Reveal>

          <ol className="mt-16 space-y-12">
            {milestones.map((m, i) => (
              <Reveal key={m.year} delay={i * 0.08}>
                <li className="grid gap-4 sm:grid-cols-[120px_1fr] sm:gap-10">
                  <p className="font-display text-3xl font-light text-brass-600 dark:text-brass-300">{m.year}</p>
                  <div className="border-l-2 border-forest-200 pl-6 dark:border-forest-800">
                    <h3 className="font-display text-2xl font-medium">{m.title}</h3>
                    <p className="mt-2 leading-relaxed text-fg-muted">{m.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Come and see it for yourself
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-fg-muted">
            Twenty-four suites, forty-eight acres and one very well-fed kitchen garden.
          </p>
          <LinkButton href="/rooms" size="lg" className="mt-9">
            Browse Suites
          </LinkButton>
        </Reveal>
      </section>
    </div>
  );
}
