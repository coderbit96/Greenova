import { Schema, model, models, type Model } from "mongoose";

export interface INewsletterSubscriber {
  email: string;
  status: "SUBSCRIBED" | "UNSUBSCRIBED";
  subscribedAt: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    status: { type: String, enum: ["SUBSCRIBED", "UNSUBSCRIBED"], default: "SUBSCRIBED", index: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: Date,
  },
  { timestamps: true },
);

export default (models.NewsletterSubscriber || model<INewsletterSubscriber>(
  "NewsletterSubscriber",
  NewsletterSubscriberSchema,
)) as Model<INewsletterSubscriber>;
