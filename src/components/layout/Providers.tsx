"use client";

import { SessionProvider } from "next-auth/react";
import MotionProvider from "@/components/ui/MotionProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MotionProvider>{children}</MotionProvider>
    </SessionProvider>
  );
}
