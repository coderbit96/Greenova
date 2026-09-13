import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  HandHeart,
  ShieldCheck,
  Wallet,
  Waves,
  Mountain,
  Flame,
  Compass,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  Car,
  Plane,
} from "lucide-react";
import Reveal, { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Newsletter from "@/components/home/Newsletter";

/* ── Why choose Greenova ──────────────────────────────────── */

const reasons = [
  {
    Icon: Leaf,
    title: "Carbon negative since 2024",
    body: "Solar, biogas and forty thousand replanted native saplings. The estate absorbs more than it emits, verified annually.",
  },
  {
    Icon: HandHeart,
    title: "Two staff per guest",
    body: "Most of them grew up in the valley. They will remember how you take your coffee by the second morning.",
  },
  {
    Icon: Wallet,
    title: "No resort fee, ever",
    body: "Breakfast, the spa circuit and the morning walk are in the rate. The price you see is the price you pay.",
  },
  {
    Icon: ShieldCheck,
    title: "Free cancellation",
    body: "Up to 48 hours before arrival, refunded in full to your card. No arguments, no phone calls.",
  },
];

export function WhyChoose() {
  return (
    <section className="bg-bg-subtle py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Why Greenova
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Four reasons people
            <span className="italic"> come back</span>
          </h2>
        </Reveal>

        <Stagger className="mt-16 grid gap-6 sm:grid-cols-2">
          {reasons.map(({ Icon, title, body }) => (
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
      </div>
    </section>
  );
}

/* ── Luxury experiences ───────────────────────────────────── */

const experiences = [
  {
    Icon: Waves,
    title: "Spring Spa Circuit",
    body: "Cold plunge, steam room and a treatment pavilion built over the water.",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
  },
  {
    Icon: Mountain,
    title: "Sunrise Ridge Trek",
    body: "Out at first light with naturalists born on this hillside.",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    Icon: Flame,
    title: "Private Terrace Dinner",
    body: "Nine courses, a fire pit and eight hundred feet of darkness below.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    Icon: Compass,
    title: "Coffee Estate Walk",
    body: "From cherry to cup, on the plantation the retreat was built around.",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop",
  },
];

export function LuxuryExperiences() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Curated
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Luxury experiences
          </h2>
        </div>
        <Link
          href="/amenities"
          className="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900 dark:text-forest-400 dark:hover:text-forest-200"
        >
          All experiences
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {experiences.map(({ Icon, title, body, image }) => (
          <StaggerItem key={title}>
            <article className="group relative h-80 overflow-hidden rounded-3xl">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-6 bottom-6">
                <span className="mb-3 inline-grid size-10 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur">
                  <Icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-2xl font-medium text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/80">{body}</p>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ── Dining teaser ────────────────────────────────────────── */

export function DiningTeaser() {
  return (
    <section className="bg-bg-subtle py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-[2rem]">
                <Image
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1400&auto=format&fit=crop"
                  alt="The estate kitchen at service"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-10 right-4 hidden aspect-square w-48 overflow-hidden rounded-3xl border-8 border-bg-subtle shadow-2xl lg:right-[-2rem] lg:block lg:w-56">
                <Image
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
                  alt="Breakfast on the verandah"
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
              The Kitchen
            </p>
            <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
              Harvested at dawn,
              <span className="italic"> on your plate by dusk</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-fg-muted">
              <p>
                One menu, rewritten daily around whatever the kitchen garden gives up that
                morning. Nine courses if you have the evening, three if you do not.
              </p>
              <p>
                The bread is baked at four. The coffee is grown four hundred metres from
                your table. There is no printed wine list — tell the sommelier what you are
                enjoying and something will appear.
              </p>
            </div>

            <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-border-base pt-8">
              {[
                { value: "3", label: "Venues" },
                { value: "400", label: "Wine labels" },
                { value: "1", label: "Menu, daily" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl font-light text-forest-700 dark:text-forest-400">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs tracking-wide text-fg-muted uppercase">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>

            <LinkButton href="/dining" variant="outline" className="mt-9">
              Explore Dining
            </LinkButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Special offers ───────────────────────────────────────── */

const offers = [
  {
    tag: "Stay longer",
    title: "The Fourth Night",
    saving: "25% off",
    body: "Book three nights and the fourth is a quarter of the price.",
    featured: true,
  },
  {
    tag: "Monsoon",
    title: "Green Season",
    saving: "From ₹8,900",
    body: "June to September, when the estate is at its most alive.",
    featured: false,
  },
  {
    tag: "Two people",
    title: "The Long Weekend",
    saving: "Spa included",
    body: "Friday to Monday, with a private terrace dinner for two.",
    featured: false,
  },
];

export function OffersTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Rates &amp; Packages
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Special offers
          </h2>
        </div>
        <Link
          href="/offers"
          className="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900 dark:text-forest-400 dark:hover:text-forest-200"
        >
          All offers
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
        {offers.map((offer) => (
          <StaggerItem key={offer.title}>
            <article className="flex h-full flex-col rounded-3xl border border-border-base bg-bg-elevated p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs tracking-wider text-brass-600 uppercase dark:text-brass-300">
                  {offer.tag}
                </p>
                {offer.featured && <Badge tone="brass">Most booked</Badge>}
              </div>
              <h3 className="mt-3 font-display text-2xl font-medium">{offer.title}</h3>
              <p className="mt-1 font-display text-xl font-medium text-forest-700 dark:text-forest-400">
                {offer.saving}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">{offer.body}</p>
              <LinkButton href="/offers" variant="outline" size="sm" className="mt-6 self-start">
                View offer
              </LinkButton>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ── Gallery strip ────────────────────────────────────────── */

const galleryStrip = [
  {
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
    alt: "A suite terrace overlooking the valley",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop",
    alt: "Bedroom of the Canopy Suite",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
    alt: "Open-air stone bathroom",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800&auto=format&fit=crop",
    alt: "The infinity pool over the valley",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
    alt: "Reading mezzanine in the Forest Loft",
    span: "",
  },
];

export function GalleryStrip() {
  return (
    <section className="bg-bg-subtle py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
              Photography
            </p>
            <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
              The estate, in pictures
            </h2>
          </div>
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900 dark:text-forest-400 dark:hover:text-forest-200"
          >
            Full gallery
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <div className="mt-14 grid auto-rows-[180px] grid-cols-2 gap-4 sm:grid-cols-4">
          {galleryStrip.map((photo, i) => (
            <Reveal
              key={photo.src}
              delay={Math.min(i * 0.06, 0.3)}
              className={`group relative overflow-hidden rounded-3xl ${photo.span}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Nearby attractions ───────────────────────────────────── */

const attractions = [
  {
    name: "Abbey Falls",
    distance: "12 km",
    time: "25 minutes",
    body: "Seventy feet of water through coffee and spice plantations, loudest just after the monsoon.",
  },
  {
    name: "Tadiandamol Peak",
    distance: "28 km",
    time: "1 hour",
    body: "The highest point in Coorg. A four-hour round trek that our naturalists lead on request.",
  },
  {
    name: "Namdroling Monastery",
    distance: "34 km",
    time: "1 hour 10",
    body: "The Golden Temple at Bylakuppe, home to five thousand monks and a remarkable silence.",
  },
  {
    name: "Dubare Elephant Camp",
    distance: "41 km",
    time: "1 hour 20",
    body: "A working forestry camp on the Kaveri. Best reached at dawn, before the coaches arrive.",
  },
];

export function NearbyAttractions() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
          Beyond the Estate
        </p>
        <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
          Nearby attractions
        </h2>
        <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
          Most guests never leave. For those who do, the front desk arranges a car and a
          driver who knows the roads in the rain.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-5 sm:grid-cols-2">
        {attractions.map((place) => (
          <StaggerItem key={place.name}>
            <div className="flex h-full items-start justify-between gap-6 rounded-3xl border border-border-base bg-bg-elevated p-7">
              <div>
                <h3 className="font-display text-xl font-medium">{place.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{place.body}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-2xl font-light text-forest-700 dark:text-forest-400">
                  {place.distance}
                </p>
                <p className="mt-0.5 text-xs whitespace-nowrap text-fg-muted">{place.time}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────── */

const faqs = [
  {
    q: "What time is check-in?",
    a: "From 2:00 PM, and check-out is until 11:00 AM. We will almost always accommodate an early arrival or late departure at no charge if the room allows it.",
  },
  {
    q: "What is included in the rate?",
    a: "Breakfast, the full spa circuit, the morning guided walk, all taxes and Wi-Fi. There is no resort fee and there never has been.",
  },
  {
    q: "Can I cancel?",
    a: "Free of charge up to 48 hours before arrival, refunded in full to your original payment method. Inside 48 hours we charge the first night.",
  },
  {
    q: "How do I get there?",
    a: "Three hours from Mangalore airport, five from Bengaluru. We arrange a car for either — the last eleven kilometres are estate track that a low car will not enjoy.",
  },
  {
    q: "Are children and dogs welcome?",
    a: "Both. Cots are free and the kitchen cooks off-menu for younger guests. Dogs stay free in the Garden Rooms and the Valley Villa.",
  },
];

export function HomeFAQ() {
  return (
    <section className="bg-bg-subtle py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Before you book
          </p>
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Frequently asked
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="divide-y divide-border-base overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
            {faqs.map((item) => (
              // <details> keeps this working without JavaScript and keeps the
              // answers in the HTML for search engines.
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium text-fg transition-colors hover:bg-bg-subtle">
                  {item.q}
                  <span
                    aria-hidden
                    className="grid size-6 shrink-0 place-items-center rounded-full border border-border-base text-fg-muted transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-pretty text-fg-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-8 text-center">
          <Link
            href="/faq"
            className="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900 dark:text-forest-400 dark:hover:text-forest-200"
          >
            Read all questions
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Newsletter ───────────────────────────────────────────── */

export function NewsletterSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="rounded-[2rem] border border-border-base bg-bg-elevated px-8 py-16 text-center">
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
          Stay in touch
        </p>
        <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
          Four letters a year
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-pretty text-fg-muted">
          When the monsoon breaks, when the coffee flowers, when we open a new suite. No
          more often than that, and never a sales email.
        </p>
        <div className="mt-9">
          <Newsletter />
        </div>
      </Reveal>
    </section>
  );
}

/* ── Contact & location ───────────────────────────────────── */

export function ContactLocation() {
  return (
    <section className="bg-forest-950 py-24 text-forest-100 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-300 uppercase">
              Find us
            </p>
            <h2 className="font-display text-4xl leading-tight font-light text-balance text-white sm:text-5xl">
              Canopy Ridge Road,
              <span className="italic"> Coorg</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-pretty text-forest-300">
              Forty-eight acres on the western slope, eleven kilometres of estate track
              from the nearest village. Let us drive that last stretch for you.
            </p>

            <dl className="mt-10 space-y-6">
              {[
                {
                  Icon: MapPin,
                  label: "Address",
                  value: "Canopy Ridge Road\nCoorg, Karnataka 571201",
                },
                { Icon: Phone, label: "Reservations", value: "+91 1800 425 000" },
                { Icon: Mail, label: "Email", value: "stay@greenova.com" },
                { Icon: Clock, label: "Front desk", value: "Open 24 hours, every day" },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-forest-900 text-brass-300">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs tracking-wider text-forest-400 uppercase">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-white">
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href="/contact" variant="secondary">
                Send a Message
              </LinkButton>
              <LinkButton
                href="/availability"
                variant="outline"
                className="border-white/30 text-white hover:border-white/50 hover:bg-white/10"
              >
                Check Availability
              </LinkButton>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative h-full min-h-[420px] overflow-hidden rounded-[2rem]">
              <Image
                src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1400&auto=format&fit=crop"
                alt="Mist over the Greenova estate at dawn"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-transparent" />

              {/* Travel times, the thing guests actually need from a map. */}
              <div className="absolute inset-x-6 bottom-6 grid gap-3 sm:grid-cols-2">
                {[
                  { Icon: Plane, label: "Mangalore airport", value: "3 hours" },
                  { Icon: Car, label: "Bengaluru", value: "5 hours" },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl bg-black/45 px-4 py-3 backdrop-blur"
                  >
                    <Icon className="size-4 shrink-0 text-brass-300" />
                    <div className="min-w-0">
                      <p className="truncate text-xs text-white/70">{label}</p>
                      <p className="text-sm font-medium text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
