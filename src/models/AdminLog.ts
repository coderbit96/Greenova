import { Schema, model, models, type Model } from "mongoose";

export interface IAdminLog {
  admin: Schema.Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
  createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, maxlength: 100, index: true },
    targetType: { type: String, required: true, maxlength: 100, index: true },
    targetId: { type: String, maxlength: 100 },
    detail: { type: String, maxlength: 1_000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
AdminLogSchema.index({ createdAt: -1 });

export default (models.AdminLog || model<IAdminLog>("AdminLog", AdminLogSchema)) as Model<IAdminLog>;
