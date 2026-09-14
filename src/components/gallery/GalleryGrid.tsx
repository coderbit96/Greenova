"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils";

export interface GalleryPhoto {
  src: string;
  alt: string;
  caption: string;
  span: string;
}

/**
 * A progressively enhanced gallery: photographs remain a simple grid, while
 * mouse, touch and keyboard users can inspect a photo in an accessible modal.
 */
export default function GalleryGrid({ photographs }: { photographs: GalleryPhoto[] }) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const photo = active === null ? null : photographs[active];

  useEffect(() => {
    if (active === null) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft") setActive((index) => index === null ? null : (index - 1 + photographs.length) % photographs.length);
      if (event.key === "ArrowRight") setActive((index) => index === null ? null : (index + 1) % photographs.length);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, photographs.length]);

  const go = (delta: number) => {
    setActive((index) => index === null ? index : (index + delta + photographs.length) % photographs.length);
  };

  return (
    <>
      <div className="mt-16 grid auto-rows-[240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {photographs.map((item, index) => (
          <motion.button
            key={item.src}
            type="button"
            onClick={() => setActive(index)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
            className={cn("group relative overflow-hidden rounded-3xl text-left focus-visible:outline-offset-4", item.span)}
            aria-label={`Open photograph: ${item.caption}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="absolute right-5 bottom-5 left-5 translate-y-2 text-sm font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              {item.caption}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {photo && active !== null && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={photo.caption}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setActive(null)} aria-label="Close gallery" />
            <motion.figure
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex max-h-full w-full max-w-6xl flex-col"
            >
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-black shadow-2xl">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1800}
                  height={1200}
                  sizes="(max-width: 1280px) 100vw, 1200px"
                  className="max-h-[78svh] w-full object-contain"
                  priority
                />
                <button ref={closeRef} type="button" onClick={() => setActive(null)} className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/80" aria-label="Close gallery">
                  <X className="size-5" />
                </button>
                {photographs.length > 1 && (
                  <>
                    <ModalNav direction="previous" onClick={() => go(-1)} />
                    <ModalNav direction="next" onClick={() => go(1)} />
                  </>
                )}
              </div>
              <figcaption className="px-3 pt-4 text-center text-sm font-medium text-white sm:text-base">{photo.caption}</figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ModalNav({ direction, onClick }: { direction: "previous" | "next"; onClick: () => void }) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} photograph`}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/80",
        direction === "previous" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-6" />
    </button>
  );
}
