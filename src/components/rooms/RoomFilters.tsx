"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/utils";

export const ROOM_SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
] as const;

const PRICE_BANDS = [
  { value: "", label: "Any price" },
  { value: "0-12000", label: "Under ₹12,000" },
  { value: "12000-25000", label: "₹12,000 – ₹25,000" },
  { value: "25000-40000", label: "₹25,000 – ₹40,000" },
  { value: "40000-", label: "₹40,000+" },
];

const GUEST_OPTIONS = ["", "1", "2", "3", "4", "5", "6"];

/**
 * Filter and sort controls for the room listing.
 *
 * State lives in the URL rather than component state, so a filtered listing
 * is shareable, survives a refresh, and stays server-rendered.
 */
export default function RoomFilters({
  categories,
  resultCount,
}: {
  categories: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const category = params.get("category") ?? "";
  const price = params.get("price") ?? "";
  const guests = params.get("guests") ?? "";
  const sort = params.get("sort") ?? "recommended";
  const availableOnly = params.get("availableOnly") === "1";

  // Date params drive availability and must survive a "clear filters".
  const hasFilters = Boolean(category || price || guests || availableOnly) || sort !== "recommended";

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    for (const k of ["category", "price", "guests", "sort", "availableOnly"]) next.delete(k);
    router.push(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div className="rounded-3xl border border-border-base bg-bg-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <SlidersHorizontal className="size-4 text-forest-500" />
          Filter &amp; sort
          <span className="font-normal text-fg-muted">
            · {resultCount} {resultCount === 1 ? "room" : "rooms"}
          </span>
        </p>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
          >
            <X className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Category"
          value={category}
          onChange={(v) => setParam("category", v)}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />

        <Select
          label="Price per night"
          value={price}
          onChange={(v) => setParam("price", v)}
          options={PRICE_BANDS}
        />

        <Select
          label="Guests"
          value={guests}
          onChange={(v) => setParam("guests", v)}
          options={GUEST_OPTIONS.map((g) => ({
            value: g,
            label: g ? `${g}+ ${g === "1" ? "guest" : "guests"}` : "Any size",
          }))}
        />

        <Select
          label="Sort by"
          value={sort}
          onChange={(v) => setParam("sort", v === "recommended" ? "" : v)}
          options={ROOM_SORTS.map((s) => ({ value: s.value, label: s.label }))}
        />
      </div>

      <label className="mt-4 flex min-h-11 w-fit cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm text-fg transition-colors hover:bg-bg-subtle">
        <input
          type="checkbox"
          checked={availableOnly}
          onChange={(e) => setParam("availableOnly", e.target.checked ? "1" : "")}
          className="size-4 accent-forest-600"
        />
        Show available rooms only
      </label>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col">
      <span className="mb-1.5 text-[0.7rem] font-medium tracking-wider text-fg-muted uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full cursor-pointer rounded-xl border border-border-base bg-bg px-3.5 py-2.5",
          "text-sm font-medium text-fg outline-none transition-colors",
          "focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
