import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listFeaturedRooms } from "@/services/room.service";
import { getHotelSettings } from "@/services/settings.service";
import Hero from "@/components/home/Hero";
import { Intro, Amenities, Testimonials, ClosingCTA } from "@/components/home/Sections";
import {
  WhyChoose,
  LuxuryExperiences,
  DiningTeaser,
  OffersTeaser,
  GalleryStrip,
  NearbyAttractions,
  HomeFAQ,
  NewsletterSection,
  ContactLocation,
} from "@/components/home/HomeSections";
import RoomCard from "@/components/rooms/RoomCard";
import Reveal from "@/components/ui/Reveal";
import type { RoomDTO } from "@/types/models";

// Featured rooms change rarely; revalidate hourly rather than per request.
export const revalidate = 3600;

export default async function HomePage() {
  let rooms: RoomDTO[] = [];
  let content: { homeHeroTitle?: string; homeHeroSubtitle?: string } = {};

  try {
    rooms = await listFeaturedRooms(3);
  } catch (err) {
    // A missing database should not blank the marketing page.
    console.error("[home] could not load rooms:", err);
  }

  try {
    const settings = await getHotelSettings() as { content?: typeof content };
    content = settings.content ?? {};
  } catch (err) {
    console.error("[home] could not load managed content:", err);
  }

  return (
    <>
      {/* Hero carries the booking search, which queries live availability. */}
      <Hero title={content.homeHeroTitle || undefined} subtitle={content.homeHeroSubtitle || undefined} />

      <Intro />

      {rooms.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
                Accommodation
              </p>
              <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
                Suites among the treetops
              </h2>
            </div>
            <Link
              href="/rooms"
              className="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900 dark:text-forest-400 dark:hover:text-forest-200"
            >
              View all rooms
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <RoomCard key={room._id} room={room} index={i} />
            ))}
          </div>
        </section>
      )}

      <WhyChoose />
      <Amenities />
      <LuxuryExperiences />
      <DiningTeaser />
      <OffersTeaser />
      <GalleryStrip />
      <Testimonials />
      <NearbyAttractions />
      <HomeFAQ />
      <NewsletterSection />
      <ContactLocation />
      <ClosingCTA />
    </>
  );
}
