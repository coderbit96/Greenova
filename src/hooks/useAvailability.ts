"use client";

import { useEffect, useState } from "react";
import { nightsBetween } from "@/utils";

export interface AvailabilityState {
  available: boolean;
  unitsLeft: number;
}

/**
 * Live availability for a room and date range, debounced so changing dates
 * does not spam the API.
 */
export function useAvailability(params: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms?: number;
  debounceMs?: number;
}) {
  const { roomId, checkIn, checkOut, adults, children, rooms = 1, debounceMs = 350 } = params;
  const [fetched, setFetched] = useState<AvailabilityState | null>(null);
  const [checking, setChecking] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);

  // An invalid range has no availability by definition — derive it rather
  // than clearing state inside the effect, which would cascade a render.
  const availability = nights < 1 ? null : fetched;

  useEffect(() => {
    if (nights < 1) return;

    // Ignore a response that arrives after the inputs have moved on.
    let active = true;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const query = new URLSearchParams({
          roomId,
          checkIn,
          checkOut,
          adults: String(adults),
          children: String(children),
          rooms: String(rooms),
        });
        const res = await fetch(`/api/availability?${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Availability lookup failed");
        const data = await res.json();
        if (active) setFetched({ available: data.available, unitsLeft: data.unitsLeft });
      } catch (err) {
        if (active && (err as Error).name !== "AbortError") setFetched(null);
      } finally {
        if (active) setChecking(false);
      }
    }, debounceMs);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [roomId, checkIn, checkOut, adults, children, rooms, nights, debounceMs]);

  return { availability, checking: checking && nights >= 1, nights };
}
