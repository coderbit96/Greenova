import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Experiences",
  description:
    "The spa, the estate kitchen, guided treks and everything else that happens between check-in and check-out at Greenova.",
};

const experiences = [
  {
    title: "The Spring Spa",
    body: "Four pavilions built over the water, a cold plunge cut into the rock and a steam room that smells of the cardamom growing outside it. Treatments use oils pressed on the estate.",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1400&auto=format&fit=crop",
    meta: "Open 7am – 9pm · Included in every rate",
  },
  {
    title: "The Estate Kitchen",
    body: "One menu, rewritten daily around whatever the garden gives up that morning. Nine courses if you have the evening, three if you do not. The bread is baked at four.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1400&auto=format&fit=crop",
    meta: "Dinner 7pm – 10pm · Reservation required",
  },
  {
    title: "Canopy Treks",
    body: "Out at first light with naturalists who were born on this hillside. Hornbills, langurs and, if the season is right, the leopard the neighbours still insist is a rumour.",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1400&auto=format&fit=crop",
    meta: "Daily at 6am · Two to four hours",
  },
  {
    title: "The Valley Pool",
    body: "Heated year round and cantilevered over eight hundred feet of nothing. Swim at midnight when the mist comes up and the valley disappears beneath you.",
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1400&auto=format&fit=crop",
    meta: "Open 6am – midnight",
  },
];

export default function AmenitiesPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 dark:text-brass-300 uppercase">
            The Estate
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Experiences
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            Everything below is included in your rate. Nothing below requires you to leave
            the property, and most of it does not require you to leave your veranda.
          </p>
        </Reveal>

        <div className="mt-20 space-y-24 lg:space-y-32">
          {experiences.map((exp, i) => (
            <Reveal key={exp.title}>
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden rounded-[2rem]">
                  <Image
                    src={exp.image}
                    alt={exp.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div>
                  <h2 className="font-display text-4xl leading-tight font-light text-balance">
                    {exp.title}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
                    {exp.body}
                  </p>
                  <p className="mt-6 text-xs tracking-wider text-brass-600 uppercase dark:text-brass-300">
                    {exp.meta}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-28 rounded-[2rem] bg-bg-subtle px-8 py-16 text-center">
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            All of it, included
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-fg-muted">
            Every rate covers breakfast, the full spa circuit and the morning walk. There
            is no resort fee, and there never has been.
          </p>
          <LinkButton href="/rooms" size="lg" className="mt-9">
            Check Availability
          </LinkButton>
        </Reveal>
      </div>
    </div>
  );
}
