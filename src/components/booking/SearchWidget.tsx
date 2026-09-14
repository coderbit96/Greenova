"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CalendarDays, Users, BedDouble, Baby } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { useStayDates } from "@/hooks/useStayDates";

/**
 * The booking search. Submitting runs a real MongoDB availability query on
 * /availability — every field here narrows that query, including Rooms, which
 * requires that many units of a room type to be free.
 */
export default function SearchWidget({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const {
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    today,
    minCheckOut,
    setCheckIn,
    setCheckOut,
    setAdults,
    setChildren,
    setRooms,
  } = useStayDates();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searching) return;

    if (checkOut <= checkIn) {
      toast.error("Check-out must be after check-in.");
      return;
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
    setSearching(true);
    router.push(`/availability?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "grid gap-3 rounded-2xl border border-border-base bg-bg-elevated p-4 sm:grid-cols-2 lg:grid-cols-6"
          : "grid gap-3 rounded-3xl border border-white/20 bg-sand-50/95 p-4 shadow-2xl backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-6 dark:border-white/10 dark:bg-sand-950/90"
      }
    >
      <Field label="Check in" icon={<CalendarDays className="size-3.5" />}>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-fg outline-none"
          aria-label="Check-in date"
        />
      </Field>

      <Field label="Check out" icon={<CalendarDays className="size-3.5" />}>
        <input
          type="date"
          value={checkOut}
          min={minCheckOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-fg outline-none"
          aria-label="Check-out date"
        />
      </Field>

      <Field label="Adults" icon={<Users className="size-3.5" />}>
        <select
          value={adults}
          onChange={(e) => setAdults(Number(e.target.value))}
          className="w-full cursor-pointer bg-transparent text-sm font-medium text-fg outline-none"
          aria-label="Number of adults"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "Adult" : "Adults"}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Children" icon={<Baby className="size-3.5" />}>
        <select
          value={children}
          onChange={(e) => setChildren(Number(e.target.value))}
          className="w-full cursor-pointer bg-transparent text-sm font-medium text-fg outline-none"
          aria-label="Number of children"
        >
          {[0, 1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "Child" : "Children"}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Rooms" icon={<BedDouble className="size-3.5" />}>
        <select
          value={rooms}
          onChange={(e) => setRooms(Number(e.target.value))}
          className="w-full cursor-pointer bg-transparent text-sm font-medium text-fg outline-none"
          aria-label="Number of rooms"
        >
          {[1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "Room" : "Rooms"}
            </option>
          ))}
        </select>
      </Field>

      <Button type="submit" size="lg" loading={searching} className="h-full min-h-14 w-full">
        <Search className="size-4" />
        {searching ? "Checking rooms" : "Search Rooms"}
      </Button>
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col justify-center rounded-2xl bg-bg-subtle px-4 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-forest-500/40">
      <span className="mb-0.5 flex items-center gap-1.5 text-[0.7rem] font-medium tracking-wider text-fg-muted uppercase">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
