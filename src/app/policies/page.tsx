import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Check-in, cancellation, children, pets, accessibility and house policies for guests of Greenova.",
};

const sections = [
  {
    h: "Check-in and check-out",
    p: "Check-in is from 2:00 PM and check-out is until 11:00 AM. We will always try to accommodate early arrivals and late departures at no charge, subject to the room being free. Tell us your arrival time when you book and we will hold the kitchen if you are getting in late.",
  },
  {
    h: "Cancellation",
    p: "Cancel free of charge up to 48 hours before your arrival date and we refund the full amount to the original payment method. Cancellations inside 48 hours, and no-shows, are charged the first night. Green Season rates cancel free up to 24 hours before arrival. Refunds are released immediately and typically settle within five to seven working days.",
  },
  {
    h: "Payment",
    p: "Reservations are confirmed once payment has been received in full. Payments are processed by Razorpay in Indian Rupees; card details never reach our servers. Rates are quoted per room per night and include all taxes shown at checkout. There is no resort fee.",
  },
  {
    h: "Occupancy",
    p: "Each room has a stated maximum occupancy which we cannot exceed, for fire safety reasons. Children of all ages are welcome and cots are provided free of charge. An extra bed can be added to the Valley Villa and Canopy Suite for a supplement.",
  },
  {
    h: "Children",
    p: "Children are welcome throughout the estate. The pool is unfenced and supervised until 8:00 PM; outside those hours children must be accompanied. The Cellar is adults-only after 9:00 PM. The kitchen will cook off-menu for younger guests at any hour.",
  },
  {
    h: "Pets",
    p: "Dogs are welcome in the Garden Rooms and the Valley Villa at no charge. We ask that they are kept off the estate trails at dawn and dusk when wildlife is moving, and are not left alone in rooms. Other animals by prior arrangement.",
  },
  {
    h: "Accessibility",
    p: "The Garden Rooms are step-free from the car park through to the restaurant, spa and pool. The upper terraces are reached by stairs and uneven forest paths that we cannot make level without felling trees. Tell us what you need when booking and we will place you where the estate works for you.",
  },
  {
    h: "Smoking",
    p: "Smoking is not permitted anywhere on the property, indoors or out, including balconies and terraces. This is a working forest and the fire risk between January and April is real. A cleaning charge applies to rooms smoked in.",
  },
  {
    h: "The estate and your safety",
    p: "Greenova is a working rainforest estate. Paths are uneven, wildlife is genuinely wild and the weather changes quickly. We ask that guests stay on marked trails after dark and take a torch. Guided walks are led by naturalists and are the safest way to see the ridge.",
  },
  {
    h: "Damage and liability",
    p: "Greenova is not liable for loss of or damage to personal belongings; a safe is provided in every room. Guests are responsible for damage caused to hotel property during their stay, which will be charged at cost.",
  },
  {
    h: "Events and photography",
    p: "We host one event a month at most, so that other guests keep the quiet they booked. Commercial photography and filming require written permission in advance.",
  },
  {
    h: "Force majeure",
    p: "If we cannot honour a reservation because of events outside our control — landslides on the approach road, flooding, or a government order — we refund in full. We do not cover your travel costs, so we recommend insurance during the monsoon.",
  },
];

export default function PoliciesPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            House Rules
          </p>
          <h1 className="font-display text-5xl leading-tight font-light">Policies</h1>
          <p className="mt-4 text-sm text-fg-muted">Last updated 13 September 2026</p>
          <p className="mt-6 text-base leading-relaxed text-pretty text-fg-muted">
            The rules that govern a stay, written plainly. For the legal wording see our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-fg">
              Terms of Stay
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-fg">
              Privacy Policy
            </Link>
            .
          </p>
        </Reveal>

        <div className="mt-14 space-y-10">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={Math.min(i * 0.03, 0.2)}>
              <section>
                <h2 className="font-display text-2xl font-medium">{s.h}</h2>
                <p className="mt-3 leading-relaxed text-pretty text-fg-muted">{s.p}</p>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 rounded-3xl bg-bg-subtle p-8">
          <h2 className="font-display text-xl font-medium">Questions about any of this?</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Our{" "}
            <Link href="/faq" className="underline underline-offset-4 hover:text-fg">
              FAQ
            </Link>{" "}
            covers the common ones, or{" "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-fg">
              write to us
            </Link>{" "}
            and a person will reply — usually the same day.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
