"use client";

import { useMemo, useState } from "react";
import { addDays, nightsBetween, toDateInput, todayUTC } from "@/utils";

/**
 * Check-in/check-out state that keeps check-out strictly after check-in,
 * shared by the hero search widget and the room booking panel.
 */
export function useStayDates(initial?: {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}) {
  const today = toDateInput(todayUTC());
  const tomorrow = toDateInput(addDays(todayUTC(), 1));

  const [checkIn, setCheckInRaw] = useState(initial?.checkIn ?? today);
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? tomorrow);
  const [adults, setAdults] = useState(initial?.adults ?? 2);
  const [children, setChildren] = useState(initial?.children ?? 0);
  const [rooms, setRooms] = useState(initial?.rooms ?? 1);

  /** Moving check-in past check-out pushes check-out along with it. */
  function setCheckIn(value: string) {
    setCheckInRaw(value);
    if (value >= checkOut) setCheckOut(toDateInput(addDays(value, 1)));
  }

  const nights = nightsBetween(checkIn, checkOut);
  const minCheckOut = useMemo(() => toDateInput(addDays(checkIn, 1)), [checkIn]);

  return {
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    nights,
    today,
    minCheckOut,
    setCheckIn,
    setCheckOut,
    setAdults,
    setChildren,
    setRooms,
  };
}
