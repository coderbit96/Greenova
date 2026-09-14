import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getHotelSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Arrival, cancellation, children, accessibility, pets and everything else guests ask before booking Greenova.",
};

const groups = [
  {
    title: "Booking & payment",
    items: [
      {
        q: "How do I pay?",
        a: "In full at the time of booking, by card, UPI, net banking or wallet through Razorpay. We never see or store your card details. A confirmation with your booking reference reaches you within a minute.",
      },
      {
        q: "Can I hold a room without paying?",
        a: "A room is held for you while you complete payment, but it is only confirmed once payment clears. If you close the tab midway the reservation stays pending and you can finish it from My Bookings.",
      },
      {
        q: "What is included in the rate?",
        a: "Breakfast, the full spa circuit, the morning guided walk, all taxes and Wi-Fi. There is no resort fee. Dinner and treatments are extra unless your rate says otherwise.",
      },
      {
        q: "Do you hold rates for groups?",
        a: "For four rooms or more, write to us rather than booking online and we will quote directly. Whole-estate buyouts are possible outside December and January.",
      },
    ],
  },
  {
    title: "Changes & cancellation",
    items: [
      {
        q: "Can I cancel?",
        a: "Free of charge up to 48 hours before your arrival date, refunded in full to the original payment method. Inside 48 hours, and for no-shows, we charge the first night. Green Season rates cancel free to 24 hours.",
      },
      {
        q: "How long does a refund take?",
        a: "We release it immediately. Razorpay and your bank typically settle within five to seven working days, occasionally ten for international cards.",
      },
      {
        q: "Can I change my dates instead?",
        a: "Yes, subject to availability. Cancel and rebook from My Bookings if the new dates are open, or write to us and we will move it by hand without a fee.",
      },
    ],
  },
  {
    title: "Arrival & the estate",
    items: [
      {
        q: "What time can I check in?",
        a: "From 2pm, and out by 11am. We will almost always accommodate an early arrival or a late departure at no charge if the room allows it — just ask when you book.",
      },
      {
        q: "How do I get there?",
        a: "Three hours from Mangalore airport, five from Bengaluru. We arrange a car for either, and the last eleven kilometres are estate track that a low car will not enjoy. Let us drive it.",
      },
      {
        q: "Is there a phone signal?",
        a: "Patchy, honestly. Fibre Wi-Fi reaches every room and the main house, and there is a library where devices are politely discouraged.",
      },
    ],
  },
  {
    title: "Guests & access",
    items: [
      {
        q: "Are children welcome?",
        a: "Very. Cots are free, the kitchen will cook whatever a small person will actually eat, and the pool is unfenced but supervised until 8pm. The Cellar is adults-only after 9pm.",
      },
      {
        q: "Is the estate accessible?",
        a: "The Garden Rooms are step-free from the car park through to the restaurant, spa and pool. The upper terraces involve stairs and uneven ground. Tell us what you need and we will place you well.",
      },
      {
        q: "Can I bring a dog?",
        a: "Yes, in the Garden Rooms and the Valley Villa, at no charge. We ask that they stay off the trails at dawn and dusk, when the wildlife is moving.",
      },
      {
        q: "Do you host weddings?",
        a: "Small ones. The estate takes forty-eight guests seated and we only take one event a month, so the other guests still get the quiet they booked.",
      },
    ],
  },
];

export default async function FaqPage() {
  const settings = await getHotelSettings().catch(() => null) as null | { content?: { faqs?: Array<{ question: string; answer: string }> } };
  const managedFaqs = settings?.content?.faqs ?? [];
  const renderedGroups = managedFaqs.length ? [{ title: "Guest questions", items: managedFaqs.map((faq) => ({ q: faq.question, a: faq.answer })) }] : groups;
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Before you book
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Frequently asked
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            If your question is not here,{" "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-fg">
              write to us
            </Link>{" "}
            — a person replies, usually the same day.
          </p>
        </Reveal>

        <div className="mt-16 space-y-14">
          {renderedGroups.map((group, gi) => (
            <Reveal key={group.title} delay={gi * 0.06}>
              <section>
                <h2 className="font-display text-2xl font-medium">{group.title}</h2>

                <div className="mt-5 divide-y divide-border-base overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
                  {group.items.map((item) => (
                    // <details> gives working accordions with no JavaScript,
                    // so the content is present for search engines too.
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
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 rounded-[2rem] bg-bg-subtle px-8 py-14 text-center">
          <h2 className="font-display text-3xl leading-tight font-light text-balance">
            Still deciding?
          </h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-fg-muted">
            Check which rooms are free for your dates — it takes a moment and needs no
            account.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/availability">Check Availability</LinkButton>
            <LinkButton href="/contact" variant="outline">
              Contact Us
            </LinkButton>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
