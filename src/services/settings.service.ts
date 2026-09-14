import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import HotelSettings from "@/models/HotelSettings";
import Notification from "@/models/Notification";
import { serialize } from "@/utils";
export async function getHotelSettings() { await connectDB(); const settings = await HotelSettings.findOneAndUpdate({ key: "primary" }, { $setOnInsert: { key: "primary" } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).lean(); return serialize(settings); }
export async function updateHotelSettings(input: Record<string, unknown>) { await connectDB(); return serialize(await HotelSettings.findOneAndUpdate({ key: "primary" }, { $set: input }, { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }).lean()); }
export async function createNotification(input: { user?: string; audience: "CUSTOMER" | "ADMIN"; type: string; title: string; body: string; link?: string }) { await connectDB(); return Notification.create({ ...input, user: input.user ? new mongoose.Types.ObjectId(input.user) : undefined } as never); }
export async function listNotifications(userId?: string) { await connectDB(); return serialize(await Notification.find((userId ? { user: new mongoose.Types.ObjectId(userId) } : { audience: "ADMIN" }) as never).sort({ createdAt: -1 }).limit(50).lean()); }
