import "server-only";
import { connectDB } from "@/lib/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { serialize } from "@/utils";

export async function subscribeNewsletter(email: string) {
  await connectDB();
  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email },
    {
      $set: { status: "SUBSCRIBED", unsubscribedAt: undefined },
      $setOnInsert: { email, subscribedAt: new Date() },
    },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean();
  return serialize(subscriber);
}

export async function listNewsletterSubscribers() {
  await connectDB();
  return serialize(await NewsletterSubscriber.find({}).sort({ subscribedAt: -1 }).lean());
}
