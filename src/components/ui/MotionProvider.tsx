"use client";

import { MotionConfig } from "framer-motion";

/**
 * One motion policy for the whole application. Framer Motion will remove
 * transform-heavy effects for visitors who request reduced motion, while
 * preserving meaningful state changes such as a dialog appearing.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
