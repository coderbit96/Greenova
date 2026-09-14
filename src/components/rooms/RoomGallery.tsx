"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import type { RoomImageDTO } from "@/types/models";

const FALLBACK =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop";

/**
 * Large hero image with a thumbnail strip beneath it.
 *
 * The thumbnails are real buttons rather than a scroll-jacked carousel, so
 * the gallery works with a keyboard and needs no JavaScript to be legible.
 */
export default function RoomGallery({
  images,
  roomName,
}: {
  images: RoomImageDTO[];
  roomName: string;
}) {
  const gallery = images.length ? images : [{ url: FALLBACK, alt: roomName }];
  const [active, setActive] = useState(0);

  const current = gallery[Math.min(active, gallery.length - 1)];
  const step = (delta: number) =>
    setActive((i) => (i + delta + gallery.length) % gallery.length);

  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-[2rem] sm:aspect-16/9">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.url}
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={current.url}
              alt={current.alt ?? roomName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {gallery.length > 1 && (
          <>
            <GalleryButton side="left" onClick={() => step(-1)} />
            <GalleryButton side="right" onClick={() => step(1)} />

            <div className="absolute right-5 bottom-5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {active + 1} / {gallery.length}
            </div>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {gallery.map((img, i) => (
            <li key={img.url}>
              <motion.button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${gallery.length}`}
                aria-current={i === active}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "relative block aspect-4/3 w-full overflow-hidden rounded-xl transition-all duration-300",
                  i === active
                    ? "ring-2 ring-forest-600 ring-offset-2 ring-offset-bg dark:ring-forest-400"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 25vw, 16vw"
                  className="object-cover"
                />
              </motion.button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GalleryButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full",
        "bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
