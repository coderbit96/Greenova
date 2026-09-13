"use client";

import { Printer } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * Opens the browser print dialog, from which the guest can print or choose
 * "Save as PDF". Keeping this client-only means the invoice page itself stays
 * a server component.
 */
export default function PrintButton() {
  return (
    <Button onClick={() => window.print()} size="sm">
      <Printer className="size-4" />
      Print / Save as PDF
    </Button>
  );
}
