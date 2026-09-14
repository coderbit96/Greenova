import { Schema, model, models, type Model } from "mongoose";

export const GALLERY_CATEGORIES = ["Rooms", "Property", "Dining", "Pool", "Events", "Nature", "Experiences"] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export interface IGalleryItem {
  _id: Schema.Types.ObjectId;
  image: { url: string; publicId?: string };
  title: string;
  alt: string;
  category: GalleryCategory;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryItemSchema = new Schema<IGalleryItem>({
  image: { url: { type: String, required: true }, publicId: String },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  alt: { type: String, required: true, trim: true, maxlength: 300 },
  category: { type: String, enum: GALLERY_CATEGORIES, required: true, index: true },
  order: { type: Number, required: true, default: 0, index: true },
}, { timestamps: true });
GalleryItemSchema.index({ category: 1, order: 1 });
export default (models.GalleryItem || model<IGalleryItem>("GalleryItem", GalleryItemSchema)) as Model<IGalleryItem>;
