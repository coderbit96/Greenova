import { Schema, model, models, type Model } from "mongoose";

export interface IAmenity {
  _id: Schema.Types.ObjectId;
  name: string;
  description?: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AmenitySchema = new Schema<IAmenity>({
  name: { type: String, required: true, trim: true, maxlength: 100, unique: true },
  description: { type: String, trim: true, maxlength: 500 },
  active: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });
export default (models.Amenity || model<IAmenity>("Amenity", AmenitySchema)) as Model<IAmenity>;
