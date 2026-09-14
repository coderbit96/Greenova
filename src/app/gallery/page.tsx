import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { listGallery } from "@/services/content.service";
import GalleryGrid from "@/components/gallery/GalleryGrid";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The suites, the spa, the kitchen garden and the valley they all look out over. A photographic tour of Greenova.",
};

/**
 * A masonry-style gallery. Spans are assigned per image so the grid reads as
 * a considered composition rather than a uniform tile sheet.
 */
const fallbackPhotographs = [
  {
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
    alt: "A suite terrace overlooking the valley at dusk",
    caption: "Valley Villa, west terrace",
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
    alt: "The spring-fed spa pavilion",
    caption: "The Spring Spa",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop",
    alt: "Bedroom of the Canopy Suite",
    caption: "Canopy Suite",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1400&auto=format&fit=crop",
    alt: "The estate kitchen at service",
    caption: "The Estate Kitchen",
    span: "lg:col-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
    alt: "Morning light through the canopy on the estate trail",
    caption: "The ridge trail at first light",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop",
    alt: "Open-air stone bathroom screened by tree ferns",
    caption: "Spring Pavilion, open-air bath",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop",
    alt: "The infinity pool cantilevered over the valley",
    caption: "The Valley Pool",
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop",
    alt: "Reading mezzanine in the Forest Loft",
    caption: "Forest Loft, mezzanine",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1200&auto=format&fit=crop",
    alt: "A garden room opening onto the kitchen garden",
    caption: "Garden Room",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop",
    alt: "Mist rolling through the estate at dawn",
    caption: "Four in the morning, most mornings",
    span: "lg:col-span-2",
  },
];

export default async function GalleryPage() {
  const uploaded = (await listGallery().catch(() => [])) as unknown as Array<{
    image: { url: string }; alt: string; title: string;
  }>;
  const photographs = uploaded.length
    ? uploaded.map((photo) => ({ src: photo.image.url, alt: photo.alt, caption: photo.title, span: "" }))
    : fallbackPhotographs;
  return (
    <div className="pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-brass-600 uppercase dark:text-brass-300">
            Photography
          </p>
          <h1 className="font-display text-5xl leading-tight font-light text-balance sm:text-6xl">
            Gallery
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fg-muted">
            Nothing here is staged and nothing is borrowed. Every photograph was taken on
            the estate, most of them before eight in the morning.
          </p>
        </Reveal>

        <GalleryGrid photographs={photographs} />

        <Reveal className="mt-24 rounded-[2rem] bg-bg-subtle px-8 py-16 text-center">
          <h2 className="font-display text-4xl leading-tight font-light text-balance sm:text-5xl">
            Better in person
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-fg-muted">
            Photographs flatten the quiet. Come and hear how loud a rainforest is at dawn.
          </p>
          <LinkButton href="/availability" size="lg" className="mt-9">
            Check Availability
          </LinkButton>
        </Reveal>
      </div>
    </div>
  );
}
