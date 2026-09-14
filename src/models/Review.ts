import mongoose, { Schema, model, models, type Model } from "mongoose";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

export interface IReviewImage {
  url: string;
  publicId?: string;
}

export interface IReview {
  _id: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  guestName: string;
  rating: number;
  review: string;
  images: IReviewImage[];
  status: ReviewStatus;
  moderatedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewImageSchema = new Schema<IReviewImage>(
  {
    url: { type: String, required: true },
    publicId: String,
  },
  { _id: false },
);

const ReviewSchema = new Schema<IReview>(
  {
    // A stay can be reviewed once. This is enforced by Mongo, not only the UI.
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    guestName: { type: String, required: true, trim: true, maxlength: 140 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true, minlength: 20, maxlength: 2_000 },
    images: { type: [ReviewImageSchema], default: [] },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "HIDDEN"],
      default: "PENDING",
      index: true,
    },
    moderatedAt: Date,
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

ReviewSchema.index({ room: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });

const Review: Model<IReview> = models.Review || model<IReview>("Review", ReviewSchema);
export default Review;
