import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Stay",
  description: "Reservation, cancellation and house terms for guests of Greenova.",
};

const sections = [
  {
    h: "Reservations",
    p: "A reservation is confirmed once payment has been received in full. Rates are quoted per room per night and include breakfast, the spa circuit and the morning guided walk.",
  },
  {
    h: "Cancellation",
    p: "Cancel free of charge up to 48 hours before your arrival date and we refund the full amount to the original payment method. Cancellations inside 48 hours, and no-shows, are charged the first night.",
  },
  {
    h: "Check-in and check-out",
    p: "Check-in is from 2:00 PM and check-out is until 11:00 AM. We will always try to accommodate early arrivals and late departures, subject to availability, at no charge.",
  },
  {
    h: "Occupancy",
    p: "Each room has a stated maximum occupancy which we cannot exceed for fire safety reasons. Children of all ages are welcome; cots are provided free of charge.",
  },
  {
    h: "Payments and refunds",
    p: "Payments are processed by Razorpay in Indian Rupees. Refunds are returned to the original payment method and typically settle within five to seven working days.",
  },
  {
    h: "The estate",
    p: "This is a working forest. Paths are uneven, wildlife is genuinely wild, and we ask that guests stay on marked trails after dark. Smoking is not permitted anywhere on the property.",
  },
  {
    h: "Liability",
    p: "Greenova is not liable for loss or damage to personal belongings. A safe is provided in every room. Guests are responsible for damage caused to hotel property during their stay.",
  },
];

export default function TermsPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-5xl leading-tight font-light">Terms of Stay</h1>
        <p className="mt-4 text-sm text-fg-muted">Last updated 12 September 2026</p>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl font-medium">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-fg-muted">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
