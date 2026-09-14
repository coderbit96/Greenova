import { Schema, model, models, type Model } from "mongoose";
export interface INotification { user?: Schema.Types.ObjectId; audience: "CUSTOMER" | "ADMIN"; type: string; title: string; body: string; readAt?: Date; link?: string; createdAt: Date; }
const NotificationSchema = new Schema<INotification>({ user: { type: Schema.Types.ObjectId, ref: "User", index: true }, audience: { type: String, enum: ["CUSTOMER", "ADMIN"], required: true, index: true }, type: { type: String, required: true, index: true }, title: { type: String, required: true }, body: { type: String, required: true }, link: String, readAt: Date }, { timestamps: true });
NotificationSchema.index({ audience: 1, readAt: 1, createdAt: -1 });
export default (models.Notification || model<INotification>("Notification", NotificationSchema)) as Model<INotification>;
