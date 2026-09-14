"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/** Sidebar logout. Client-only so the layout itself stays a server component. */
export default function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
    >
      <LogOut className="size-4 shrink-0" />
      Logout
    </button>
  );
}
