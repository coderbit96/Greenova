import { Schema, model, models, type Model } from "mongoose";

const ImageSchema = new Schema({ url: { type: String, required: true }, publicId: String }, { _id: false });
export interface IDiningVenue {
  _id: Schema.Types.ObjectId;
  name: string;
  description: string;
  openingTime: string;
  closingTime: string;
  cuisine: string;
  images: Array<{ url: string; publicId?: string }>;
  highlights: string[];
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
const DiningVenueSchema = new Schema<IDiningVenue>({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true, maxlength: 2_000 },
  openingTime: { type: String, required: true, trim: true, maxlength: 40 },
  closingTime: { type: String, required: true, trim: true, maxlength: 40 },
  cuisine: { type: String, required: true, trim: true, maxlength: 120 },
  images: { type: [ImageSchema], default: [] },
  highlights: { type: [String], default: [] },
  active: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });
export default (models.DiningVenue || model<IDiningVenue>("DiningVenue", DiningVenueSchema)) as Model<IDiningVenue>;
