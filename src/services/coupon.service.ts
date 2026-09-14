import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import Booking from "@/models/Booking";
import { serialize } from "@/utils";
import type { CouponInput } from "@/validators/coupon";

export class CouponError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "CouponError"; }
}

export async function listCoupons() {
  await connectDB();
  return serialize(await Coupon.find({}).sort({ createdAt: -1 }).lean());
}

export async function createCoupon(input: CouponInput) {
  await connectDB();
  try { return serialize(await Coupon.create(input as never)); }
  catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000) throw new CouponError(409, "That coupon code already exists.");
    throw error;
  }
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  if (!mongoose.isValidObjectId(id)) throw new CouponError(400, "Invalid coupon id.");
  await connectDB();
  const coupon = await Coupon.findByIdAndUpdate(id, { $set: input }, { returnDocument: "after", runValidators: true }).lean();
  if (!coupon) throw new CouponError(404, "Coupon not found.");
  return serialize(coupon);
}

/**
 * Redeems a code as part of the server-side booking transaction. The counter
 * update is conditional, so concurrent checkouts cannot exceed a global
 * usage limit. A booking keeps the redemption even when payment is retried.
 */
export async function reserveCoupon(input: { code?: string; userId: string; roomId: string; roomAmount: number }) {
  const code = input.code?.trim().toUpperCase();
  if (!code) return { couponCode: undefined, discountAmount: 0 };
  await connectDB();
  const now = new Date();
  const coupon = await Coupon.findOne({ code, active: true, startDate: { $lte: now }, expiryDate: { $gte: now } }).lean();
  if (!coupon) throw new CouponError(400, "This coupon is not active or has expired.");
  if (coupon.minimumBookingAmount != null && input.roomAmount < coupon.minimumBookingAmount) throw new CouponError(400, "This booking does not meet the coupon minimum.");
  if (coupon.roomRestrictions.length && !coupon.roomRestrictions.some((room) => String(room) === input.roomId)) throw new CouponError(400, "This coupon is not valid for the selected room.");
  if (coupon.perUserLimit) {
    const uses = await Booking.countDocuments({ user: input.userId, couponCode: code, status: { $ne: "cancelled" } });
    if (uses >= coupon.perUserLimit) throw new CouponError(400, "You have already used this coupon.");
  }
  const filter: Record<string, unknown> = { _id: coupon._id, active: true };
  if (coupon.usageLimit != null) filter.usageCount = { $lt: coupon.usageLimit };
  const reserved = await Coupon.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }, { returnDocument: "after" }).lean();
  if (!reserved) throw new CouponError(409, "This coupon has reached its usage limit.");
  const calculated = reserved.type === "PERCENTAGE" ? Math.floor((input.roomAmount * reserved.value) / 100) : reserved.value;
  return { couponCode: reserved.code, discountAmount: Math.min(input.roomAmount, reserved.maximumDiscount != null ? Math.min(calculated, reserved.maximumDiscount) : calculated) };
}

export async function releaseCoupon(code?: string) {
  if (!code) return;
  await Coupon.updateOne({ code, usageCount: { $gt: 0 } }, { $inc: { usageCount: -1 } });
}
