import { Schema, model, models, type Model } from "mongoose";

export interface ICoupon {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minimumBookingAmount?: number;
  maximumDiscount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  roomRestrictions: Schema.Types.ObjectId[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40, index: true },
    type: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
    value: { type: Number, required: true, min: 1 },
    minimumBookingAmount: { type: Number, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    startDate: { type: Date, required: true, index: true },
    expiryDate: { type: Date, required: true, index: true },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, min: 1 },
    roomRestrictions: [{ type: Schema.Types.ObjectId, ref: "Room" }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
CouponSchema.index({ active: 1, startDate: 1, expiryDate: 1 });

export default (models.Coupon || model<ICoupon>("Coupon", CouponSchema)) as Model<ICoupon>;
