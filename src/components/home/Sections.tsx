"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Waves,
  UtensilsCrossed,
  Sparkles,
  Mountain,
  Wifi,
  Dumbbell,
  Quote,
} from "lucide-react";
import Reveal, { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

/* ── Intro ───────────────────────────────────────────────── */

export function Intro() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 dark:text-brass-300 uppercase">
            Est. 2009
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            A retreat built around
            <span className="italic text-forest-600 dark:text-forest-400"> stillness</span>
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-fg-muted">
            <p>
              Greenova began as a coffee estate. We kept the trees, the birdsong and the
              mist that rolls in at four each morning, and built around them rather than
              through them.
            </p>
            <p>
              Every suite faces the valley. Every meal starts in the kitchen garden.
              The spa draws from a spring that has run through this hillside far longer
              than we have been here.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: "24", label: "Suites & Villas" },
              { value: "48", label: "Acres of Forest" },
              { value: "4.9", label: "Guest Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-4xl font-light text-forest-700 dark:text-forest-400">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs tracking-wide text-fg-muted uppercase">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>

          <LinkButton href="/about" variant="outline" className="mt-10">
            Our Story
          </LinkButton>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-[2rem]">
              <Image
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1400&auto=format&fit=crop"
                alt="A suite overlooking the valley at Greenova"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Offset accent image */}
            <div className="absolute -bottom-10 -left-10 hidden aspect-square w-48 overflow-hidden rounded-3xl border-8 border-bg shadow-2xl sm:block lg:w-56">
              <Image
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"
                alt="The spa pavilion"
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Amenities ───────────────────────────────────────────── */

const amenities = [
  {
    Icon: Waves,
    title: "Spring-fed Spa",
    body: "Four treatment pavilions, a cold plunge and a steam room carved into the hillside.",
  },
  {
    Icon: UtensilsCrossed,
    title: "Estate Kitchen",
    body: "A daily-changing menu built from the garden, the forest and the morning market.",
  },
  {
    Icon: Mountain,
    title: "Guided Treks",
    body: "Sunrise walks to the ridge with naturalists who grew up on this hillside.",
  },
  {
    Icon: Sparkles,
    title: "Infinity Pool",
    body: "Heated year-round, cantilevered over the valley and open until midnight.",
  },
  {
    Icon: Wifi,
    title: "Connected, Quietly",
    body: "Fibre throughout, and a library where devices are politely discouraged.",
  },
  {
    Icon: Dumbbell,
    title: "Movement Studio",
    body: "Daily yoga at the pavilion, plus a fully equipped gym open around the clock.",
  },
];

export function Amenities() {
  return (
    <section className="bg-bg-subtle py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 dark:text-brass-300 uppercase">
            The Estate
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Everything you need,
            <span className="italic"> nothing you don&apos;t</span>
          </h2>
        </Reveal>

        <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map(({ Icon, title, body }) => (
            <StaggerItem key={title}>
              <div className="group h-full rounded-3xl border border-border-base bg-bg-elevated p-8 transition-all duration-500 hover:-translate-y-1 hover:border-forest-300 hover:shadow-xl dark:hover:border-forest-700">
                <span className="mb-6 inline-grid size-12 place-items-center rounded-2xl bg-forest-50 text-forest-700 transition-colors duration-500 group-hover:bg-forest-700 group-hover:text-white dark:bg-forest-900/60 dark:text-forest-300">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-xl font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ── Testimonials ────────────────────────────────────────── */

const testimonials = [
  {
    quote:
      "We came for three nights and rebooked for a week before we had unpacked. The silence is the luxury here.",
    name: "Ananya Rao",
    detail: "Canopy Suite, March",
  },
  {
    quote:
      "The kitchen sent out a nine-course tasting from produce picked that morning. I still think about the mushroom course.",
    name: "Daniel Okoye",
    detail: "Valley Villa, January",
  },
  {
    quote:
      "Staff remembered how I take my coffee on day two. Small thing. It is the reason we keep returning.",
    name: "Meera & Josh Patel",
    detail: "Forest Loft, November",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 dark:text-brass-300 uppercase">
            Guest Notes
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            In their words
          </h2>
        </Reveal>

        <Stagger className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="flex h-full flex-col rounded-3xl border border-border-base bg-bg-elevated p-8">
                <Quote className="size-8 text-brass-300" strokeWidth={1.5} />
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-pretty text-fg">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-border-base pt-5">
                  <p className="text-sm font-medium text-fg">{t.name}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{t.detail}</p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ── Closing CTA ─────────────────────────────────────────── */

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden py-28 lg:py-40">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=2000&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-forest-950/72" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="font-display text-4xl leading-tight font-light text-balance text-white sm:text-5xl lg:text-6xl">
          The forest is ready
          <span className="italic text-brass-300"> when you are</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75">
          Rates include breakfast, the spa circuit and a guided walk each morning.
          Cancel free of charge up to 48 hours before arrival.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/rooms" size="lg" variant="secondary">
            Browse Suites
          </LinkButton>
          <LinkButton
            href="/contact"
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
          >
            Speak to Us
          </LinkButton>
        </div>
      </motion.div>
    </section>
  );
}
