"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Owns the one document-level Lenis instance used throughout the app. */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      // Keeps native, immediate scrolling for people who prefer less motion.
      respectReducedMotion: true,
    });

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
