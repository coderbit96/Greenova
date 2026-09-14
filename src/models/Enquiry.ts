import { Schema, model, models, type Model } from "mongoose";

export type EnquiryStatus = "NEW" | "READ" | "REPLIED" | "CLOSED";
export interface IEnquiry {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}
const EnquirySchema = new Schema<IEnquiry>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2_000 },
  status: { type: String, enum: ["NEW", "READ", "REPLIED", "CLOSED"], default: "NEW", index: true },
}, { timestamps: true });
EnquirySchema.index({ status: 1, createdAt: -1 });
export default (models.Enquiry || model<IEnquiry>("Enquiry", EnquirySchema)) as Model<IEnquiry>;
