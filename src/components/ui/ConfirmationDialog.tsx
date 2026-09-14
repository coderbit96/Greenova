"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}

/** Reusable, mobile-safe confirmation dialog for destructive operations. */
export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  busy = false,
}: ConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end bg-black/45 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          aria-describedby="confirmation-description"
        >
          <button type="button" onClick={onClose} disabled={busy} className="absolute inset-0 cursor-default" aria-label="Close confirmation dialog" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md rounded-[2rem] border border-border-base bg-bg-elevated p-6 shadow-2xl sm:p-7"
          >
            <button type="button" onClick={onClose} disabled={busy} className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg" aria-label="Close confirmation dialog">
              <X className="size-4" />
            </button>
            <span className="grid size-11 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="size-5" />
            </span>
            <h2 id="confirmation-title" className="mt-5 pr-8 font-display text-2xl font-medium text-fg">{title}</h2>
            <p id="confirmation-description" className="mt-2 text-sm leading-relaxed text-fg-muted">{description}</p>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="rounded-full px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg-subtle disabled:opacity-50">Keep booking</button>
              <button type="button" onClick={onConfirm} disabled={busy} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:pointer-events-none disabled:opacity-50">{busy ? "Processing…" : confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
