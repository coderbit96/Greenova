import mongoose, { Schema, model, models, type Model } from "mongoose";

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

export interface IBooking {
  _id: mongoose.Types.ObjectId;
  /** Public booking identifier; mirrors the historical `reference` field. */
  bookingId: string;
  reference: string;
  userId: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
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
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: { adults: number; children: number };
  adults: number;
  children: number;
  numberOfGuests: number;
  numberOfNights: number;
  /** All monetary values are in paise. */
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
  /** Pending bookings hold inventory only until this time. */
  paymentHoldExpiresAt?: Date;
  specialRequests?: string;
  status: BookingStatus;
  payment: {
    status: PaymentStatus;
    provider: "razorpay" | "mock";
    orderId?: string;
    paymentId?: string;
    signature?: string;
    paidAt?: Date;
    refundedAt?: Date;
  };
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    reference: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    roomType: { type: String, required: true, trim: true },
    roomsBooked: { type: Number, required: true, min: 1, default: 1 },
    guest: {
      name: { type: String, required: true, trim: true },
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, trim: true, maxlength: 500 },
    },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    nights: { type: Number, required: true, min: 1 },
    guests: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, required: true, min: 0, default: 0 },
    },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, required: true, min: 0, default: 0 },
    numberOfGuests: { type: Number, required: true, min: 1 },
    numberOfNights: { type: Number, required: true, min: 1 },
    roomTotal: { type: Number, required: true, min: 0 },
    taxes: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    roomAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    additionalCharges: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true, maxlength: 40 },
    paymentMethod: { type: String, enum: ["razorpay", "mock"], default: "razorpay" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      required: true,
      index: true,
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: String,
    razorpaySignature: String,
    bookingStatus: {
      type: String,
      enum: [
        "PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT",
        "CANCELLED", "NO_SHOW", "REFUND_PENDING", "REFUNDED",
      ],
      required: true,
      index: true,
    },
    paymentHoldExpiresAt: { type: Date, index: true },
    specialRequests: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    payment: {
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      provider: { type: String, enum: ["razorpay", "mock"], default: "razorpay" },
      orderId: { type: String, index: true },
      paymentId: String,
      signature: String,
      paidAt: Date,
      refundedAt: Date,
    },
    cancelledAt: Date,
    cancellationReason: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

const legacyBookingStatus: Record<BookingStatus, BookingLifecycleStatus> = {
  pending: "PAYMENT_PENDING",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  completed: "CHECKED_OUT",
};
const legacyPaymentStatus: Record<PaymentStatus, PaymentLifecycleStatus> = {
  pending: "PENDING",
  paid: "PAID",
  failed: "FAILED",
  refunded: "REFUNDED",
};

/** Populate the canonical fields when a legacy caller creates a booking. */
BookingSchema.pre("validate", function syncCanonicalBookingFields() {
  this.bookingId ??= this.reference;
  this.userId ??= this.user;
  this.roomId ??= this.room;
  this.roomType ??= "Unspecified";
  this.roomsBooked ??= 1;
  this.adults ??= this.guests?.adults;
  this.children ??= this.guests?.children ?? 0;
  this.numberOfGuests ??= (this.adults ?? 0) + (this.children ?? 0);
  this.numberOfNights ??= this.nights;
  this.roomAmount ??= this.roomTotal;
  this.discountAmount ??= 0;
  this.taxAmount ??= this.taxes;
  this.additionalCharges ??= 0;
  this.grandTotal ??= this.totalAmount;
  this.paymentMethod ??= this.payment?.provider ?? "razorpay";
  this.paymentStatus ??= legacyPaymentStatus[this.payment?.status ?? "pending"];
  this.bookingStatus ??= legacyBookingStatus[this.status ?? "pending"];
});

// Compound index powering the date-overlap availability query.
BookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });

const Booking: Model<IBooking> = models.Booking || model<IBooking>("Booking", BookingSchema);
export default Booking;
