import { Schema, model, models, type Model } from "mongoose";

export interface IHotelSettings {
  key: "primary";
  hotel: { name: string; logo?: string; email: string; phone: string; address: string; mapsLink?: string; timezone: string; currency: string; socialLinks: Record<string, string> };
  booking: { checkIn: string; checkOut: string; maxAdvanceDays: number; minimumStayNights: number; cancellationRules: string };
  tax: { taxPercent: number; serviceChargePercent: number };
  payment: { razorpayEnabled: boolean };
  content: { homeHeroTitle?: string; homeHeroSubtitle?: string; about?: string; faqs: Array<{ question: string; answer: string }> };
}
const HotelSettingsSchema = new Schema<IHotelSettings>({
  key: { type: String, enum: ["primary"], unique: true, default: "primary" },
  hotel: { name: { type: String, default: "Greenova" }, logo: String, email: { type: String, default: "stay@greenova.com" }, phone: { type: String, default: "+91 1800 425 000" }, address: { type: String, default: "Canopy Ridge Road, Coorg, Karnataka 571201" }, mapsLink: String, timezone: { type: String, default: "Asia/Kolkata" }, currency: { type: String, default: "INR" }, socialLinks: { type: Schema.Types.Mixed, default: {} } },
  booking: { checkIn: { type: String, default: "2:00 PM" }, checkOut: { type: String, default: "11:00 AM" }, maxAdvanceDays: { type: Number, default: 365, min: 1 }, minimumStayNights: { type: Number, default: 1, min: 1 }, cancellationRules: { type: String, default: "Free cancellation up to 48 hours before arrival." } },
  tax: { taxPercent: { type: Number, default: 12, min: 0, max: 100 }, serviceChargePercent: { type: Number, default: 0, min: 0, max: 100 } },
  payment: { razorpayEnabled: { type: Boolean, default: false } },
  content: { homeHeroTitle: String, homeHeroSubtitle: String, about: String, faqs: { type: [{ question: String, answer: String }], default: [] } },
}, { timestamps: true });
export default (models.HotelSettings || model<IHotelSettings>("HotelSettings", HotelSettingsSchema)) as Model<IHotelSettings>;
