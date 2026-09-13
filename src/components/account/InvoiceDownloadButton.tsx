"use client";

import { Download } from "lucide-react";
import Button from "@/components/ui/Button";

/** Browsers provide the most reliable PDF download through their print dialog. */
export default function InvoiceDownloadButton({ reference }: { reference: string }) {
  function download() {
    const previousTitle = document.title;
    document.title = `Greenova invoice ${reference}`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 250);
  }

  return (
    <Button variant="outline" onClick={download} className="print-hidden">
      <Download className="size-4" />
      Save as PDF
    </Button>
  );
}
