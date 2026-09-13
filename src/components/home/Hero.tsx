"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ChevronDown } from "lucide-react";
import SearchWidget from "@/components/booking/SearchWidget";

const easeLuxe = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect the user's motion preference — no parallax if reduced.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Slow drift on the backdrop as the page scrolls, driven by rAF
    // rather than ScrollTrigger to keep the bundle lean.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > window.innerHeight) return;
        gsap.set(imageRef.current, { y: y * 0.4, scale: 1 + y * 0.0004 });
        gsap.set(overlayRef.current, { opacity: Math.min(0.85, 0.45 + y * 0.0009) });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Gentle initial push-in.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { scale: 1.14 },
        { scale: 1, duration: 2.2, ease: "power2.out" },
      );
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div ref={imageRef} className="absolute inset-0 -z-20 will-change-transform">
        <Image
          src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2400&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div
        ref={overlayRef}
        className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/70 via-forest-950/45 to-forest-950/85"
      />

      <div className="mx-auto w-full max-w-5xl px-4 pt-28 pb-40 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeLuxe }}
          className="mb-5 text-xs font-medium tracking-[0.32em] text-brass-300 uppercase sm:text-sm"
        >
          Coorg &middot; India
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: easeLuxe }}
          className="font-display text-5xl leading-[1.15] font-light text-balance text-white sm:text-6xl lg:text-8xl"
        >
          Where the forest
          <br />
          <span className="gradient-text inline-block pb-[0.12em] italic">breathes with you</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.26, ease: easeLuxe }}
          className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-pretty text-white/80 sm:text-lg"
        >
          Twenty-four suites suspended in the canopy. A spa fed by mountain springs.
          A kitchen that harvests at dawn. This is rest, reconsidered.
        </motion.p>
      </div>

      {/* Search widget */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.42, ease: easeLuxe }}
        className="absolute inset-x-0 bottom-0 z-20 px-4 pb-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <SearchWidget />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="pointer-events-none absolute bottom-52 left-1/2 hidden -translate-x-1/2 lg:block"
      >
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-6 text-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
