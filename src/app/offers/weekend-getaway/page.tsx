import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Check } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { LinkButton } from "@/components/ui/Button";

const image = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop";
const siteUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Weekend Getaway",
  description: "A Friday-to-Monday Greenova escape with spa access, private dinner and late checkout.",
  alternates: { canonical: "/offers/weekend-getaway" },
  openGraph: {
    title: "Weekend Getaway · Greenova",
    description: "A three-night rainforest escape for two.",
    url: "/offers/weekend-getaway",
    images: [{ url: image, alt: "The spring-fed spa at Greenova" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekend Getaway · Greenova",
    description: "A three-night rainforest escape for two.",
    images: [image],
  },
};

export default function WeekendGetawayPage() {
  return (
    <div className="pt-24 pb-24 lg:pt-32">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
              { "@type": "ListItem", position: 2, name: "Offers", item: `${siteUrl}/offers` },
              { "@type": "ListItem", position: 3, name: "Weekend Getaway", item: `${siteUrl}/offers/weekend-getaway` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Offer",
            name: "Greenova Weekend Getaway",
            description: "Three nights from Friday to Monday, with spa access, private terrace dinner and late checkout.",
            url: `${siteUrl}/offers/weekend-getaway`,
            category: "Hotel package",
            seller: { "@type": "Hotel", name: "Greenova" },
          },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-border-base bg-bg-elevated lg:grid-cols-2">
          <div className="relative min-h-80 lg:min-h-[620px]">
            <Image src={image} alt="The spring-fed spa at Greenova" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <article className="flex flex-col p-8 sm:p-12">
            <p className="text-xs tracking-[0.28em] text-brass-600 uppercase dark:text-brass-300">Two people · Friday to Monday</p>
            <h1 className="mt-4 font-display text-5xl leading-tight font-light text-balance sm:text-6xl">Weekend Getaway</h1>
            <p className="mt-5 font-display text-2xl text-forest-700 dark:text-forest-400">Spa included</p>
            <p className="mt-8 text-base leading-relaxed text-fg-muted">
              Leave the city on Friday and return only when the forest has done its work. This three-night Canopy Suite escape includes the full spa circuit, a private terrace dinner and a sunrise ridge walk.
            </p>
            <ul className="mt-8 space-y-3">
              {["Three nights, Friday to Monday", "Private terrace dinner for two", "Full spa circuit access", "Late checkout at 2pm"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-fg-muted"><Check className="size-4 text-forest-600 dark:text-forest-400" />{item}</li>
              ))}
            </ul>
            <LinkButton href="/availability" size="lg" className="mt-auto pt-10"><CalendarDays className="size-4" />Check available dates</LinkButton>
          </article>
        </div>
      </div>
    </div>
  );
}
