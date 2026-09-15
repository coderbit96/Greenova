"use client";

import { SessionProvider } from "next-auth/react";
import MotionProvider from "@/components/ui/MotionProvider";
import SmoothScroll from "@/components/ui/SmoothScroll";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MotionProvider>
        <SmoothScroll>{children}</SmoothScroll>
      </MotionProvider>
    </SessionProvider>
  );
}
