import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AdminLog from "@/models/AdminLog";
import "@/models/User";
import { serialize } from "@/utils";

export async function writeAdminLog(input: { adminId: string; action: string; targetType: string; targetId?: string; detail?: string }) {
  if (!mongoose.isValidObjectId(input.adminId)) return;
  await connectDB();
  await AdminLog.create({ admin: input.adminId, action: input.action, targetType: input.targetType, targetId: input.targetId, detail: input.detail } as never);
}

export async function listAdminLogs() {
  await connectDB();
  return serialize(await AdminLog.find({}).populate("admin", "name email").sort({ createdAt: -1 }).limit(200).lean());
}
