/**
 * All monetary values move through the system as integer paise.
 * Formatting to rupees happens only at the display edge.
 */

/** Default GST, used when a room does not override it. */
export const TAX_RATE = 0.12; // 12%

export function formatCurrency(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export interface PricedRoom {
  pricePerNight: number;
  discountedPrice?: number;
  taxRatePercent?: number;
  additionalFees?: { label: string; amount: number }[];
}

/**
 * What the guest is actually charged per night.
 *
 * A discount only counts when it is genuinely below the list price, so a
 * mistyped "discount" above the rate can never raise the bill.
 */
export function effectiveRate(room: PricedRoom): number {
  const { pricePerNight, discountedPrice } = room;
  return discountedPrice != null && discountedPrice > 0 && discountedPrice < pricePerNight
    ? discountedPrice
    : pricePerNight;
}

/** True when the room is being sold below its list price. */
export function hasDiscount(room: PricedRoom): boolean {
  return effectiveRate(room) < room.pricePerNight;
}

/** Whole-percent saving, for the "20% off" badge. */
export function discountPercent(room: PricedRoom): number {
  if (!hasDiscount(room)) return 0;
  return Math.round(((room.pricePerNight - effectiveRate(room)) / room.pricePerNight) * 100);
}

export interface PriceBreakdown {
  /** List-rate accommodation charge before discounts. */
  roomSubtotal: number;
  /** Nightly rate actually charged. */
  nightlyRate: number;
  /** Discount applied to the accommodation subtotal. */
  discountAmount: number;
  /** Discount from a validated coupon, after any room-rate promotion. */
  couponDiscountAmount: number;
  roomTotal: number;
  /** One-off charges, applied per stay rather than per night. */
  feesTotal: number;
  fees: { label: string; amount: number }[];
  taxes: number;
  totalAmount: number;
}

/**
 * Price a stay.
 *
 * Accepts either a bare nightly rate (the original signature, still used by
 * the engine tests) or a room object, in which case any discount, per-room
 * tax rate and one-off fees are applied.
 */
export function priceBreakdown(
  room: PricedRoom | number,
  nights: number,
  rooms = 1,
  couponDiscount = 0,
): PriceBreakdown {
  const priced: PricedRoom = typeof room === "number" ? { pricePerNight: room } : room;
  const safeNights = Math.max(0, Math.floor(nights));
  const safeRooms = Math.max(1, Math.floor(rooms));

  const nightlyRate = effectiveRate(priced);
  const roomSubtotal = priced.pricePerNight * safeNights * safeRooms;
  const roomRateTotal = nightlyRate * safeNights * safeRooms;
  const couponDiscountAmount = Math.min(roomRateTotal, Math.max(0, Math.floor(couponDiscount)));
  const roomTotal = roomRateTotal - couponDiscountAmount;
  const discountAmount = roomSubtotal - roomTotal;

  const fees = priced.additionalFees ?? [];
  const feesTotal = fees.reduce((sum, f) => sum + f.amount, 0);

  // A room may override the default GST; 0 is a valid override, so only an
  // absent value falls back.
  const rate =
    priced.taxRatePercent != null ? priced.taxRatePercent / 100 : TAX_RATE;

  // Tax applies to the room charge and any fees, rounded once at the end.
  const taxes = Math.round((roomTotal + feesTotal) * rate);

  return {
    nightlyRate,
    roomSubtotal,
    discountAmount,
    couponDiscountAmount,
    roomTotal,
    feesTotal,
    fees,
    taxes,
    totalAmount: roomTotal + feesTotal + taxes,
  };
}
