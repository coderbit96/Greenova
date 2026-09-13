import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Greenova collects, uses and protects your personal information.",
};

const sections = [
  {
    h: "What we collect",
    p: "When you make a reservation we collect your name, email address, phone number and any special requests you share. Payment card details are handled entirely by Razorpay and never reach our servers.",
  },
  {
    h: "How we use it",
    p: "Your information is used to hold and service your reservation, to contact you about your stay, and to meet the record-keeping obligations that apply to hotels in India. We do not sell it.",
  },
  {
    h: "Who we share it with",
    p: "Razorpay processes payments. Our email provider delivers your confirmation. Local authorities receive guest records where the law requires it. No one else.",
  },
  {
    h: "How long we keep it",
    p: "Booking records are retained for seven years to satisfy tax and hospitality regulations. You may ask us to delete anything held beyond that at any time.",
  },
  {
    h: "Your rights",
    p: "You can request a copy of your data, ask for corrections, or ask us to delete your account. Write to stay@greenova.com and we will respond within thirty days.",
  },
  {
    h: "Cookies",
    p: "We use a single session cookie to keep you signed in. There is no advertising or third-party tracking on this site.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-5xl leading-tight font-light">Privacy Policy</h1>
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
