/**
 * Serialized shapes returned by the service layer.
 *
 * Mongoose documents cannot cross the server/client boundary, so services
 * return these plain-object DTOs. Ids and dates are strings here, unlike the
 * Mongoose interfaces in `src/models`.
 */

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type BookingLifecycleStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "NO_SHOW"
  | "REFUND_PENDING"
  | "REFUNDED";
export type PaymentLifecycleStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
export type UserRole = "customer" | "admin";

export interface RoomImageDTO {
  url: string;
  publicId?: string;
  alt?: string;
}

export const ROOM_CATEGORIES = [
  "Deluxe Room",
  "Premium Room",
  "Executive Room",
  "Family Room",
  "Suite",
  "Luxury Suite",
] as const;

export type RoomCategory = (typeof ROOM_CATEGORIES)[number];

/** One physical room of a type. */
export interface RoomUnitDTO {
  roomNumber: string;
  floor: string;
  status: "available" | "maintenance" | "closed";
}

export interface AdditionalFeeDTO {
  label: string;
  /** Paise, charged once per stay. */
  amount: number;
}

export interface RoomDTO {
  _id: string;
  name: string;
  slug: string;
  category: RoomCategory;
  description: string;
  shortDescription: string;

  /** Card image; falls back to the first gallery image when unset. */
  thumbnail?: RoomImageDTO;
  images: RoomImageDTO[];

  /** Paise. */
  pricePerNight: number;
  /** When below pricePerNight, this is what the guest is charged. */
  discountedPrice?: number;

  capacity: { adults: number; children: number };
  bedType: string;
  sizeSqft: number;

  units: RoomUnitDTO[];
  totalUnits: number;

  amenities: string[];
  features: string[];

  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;

  /** Overrides the global GST rate when set. */
  taxRatePercent?: number;
  additionalFees: AdditionalFeeDTO[];

  featured: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;

  createdAt: string;
  updatedAt: string;
}

/** A room annotated with live availability for a requested date range. */
export interface RoomWithAvailability extends RoomDTO {
  unitsLeft: number;
  available: boolean;
}

export interface BookingDTO {
  _id: string;
  bookingId: string;
  reference: string;
  userId: string;
  user: string;
  roomId: string;
  /** A raw id when unpopulated; see PopulatedBookingDTO for the joined form. */
  room: RoomDTO | string | null;
  roomType: string;
  roomsBooked: number;
  guest: {
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    address?: string;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: { adults: number; children: number };
  adults: number;
  children: number;
  numberOfGuests: number;
  numberOfNights: number;
  /** All paise. */
  roomTotal: number;
  taxes: number;
  totalAmount: number;
  roomAmount: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  grandTotal: number;
  couponCode?: string;
  paymentMethod: "razorpay" | "mock";
  paymentStatus: PaymentLifecycleStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  bookingStatus: BookingLifecycleStatus;
  paymentHoldExpiresAt?: string;
  specialRequests?: string;
  status: BookingStatus;
  payment: {
    status: PaymentStatus;
    provider: "razorpay" | "mock";
    orderId?: string;
    paymentId?: string;
    paidAt?: string;
    refundedAt?: string;
  };
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role: UserRole;
  provider: "credentials" | "google";
  createdAt: string;
  updatedAt: string;
}

/** Data shown on the signed-in customer's account home. */
export interface CustomerAccountDashboardDTO {
  user: UserDTO | null;
  totalBookings: number;
  completedStays: number;
  cancelledBookings: number;
  upcomingBooking: PopulatedBookingDTO | null;
  recentActivity: PopulatedBookingDTO[];
}

export interface AvailabilityResult {
  available: boolean;
  unitsLeft: number;
  totalUnits: number;
}

export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRooms: number;
  activeRooms: number;
  totalCustomers: number;
  totalRevenue: number;
  monthRevenue: number;
  arrivalsToday: number;
  inHouse: number;
}

export interface RevenuePoint {
  _id: string; // yyyy-mm-dd
  revenue: number;
}

/** A booking whose `room` reference has been populated by the service layer. */
export type PopulatedBookingDTO = Omit<BookingDTO, "room"> & {
  room: RoomDTO | null;
};
