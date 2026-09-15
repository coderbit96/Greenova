/**
 * Creates or promotes one administrator from environment variables.
 *
 * Usage (PowerShell):
 *   $env:GREENOVA_ADMIN_EMAIL='admin@example.com'
 *   $env:GREENOVA_ADMIN_PASSWORD='use-a-strong-password'
 *   npm run create-admin
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

dotenv.config();

async function main() {
  const email = process.env.GREENOVA_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.GREENOVA_ADMIN_PASSWORD;
  const uri = process.env.MONGODB_URI;

  if (!email || !password || !uri) {
    throw new Error("GREENOVA_ADMIN_EMAIL, GREENOVA_ADMIN_PASSWORD, and MONGODB_URI are required.");
  }
  if (password.length < 6) {
    throw new Error("Use an administrator password with at least 6 characters.");
  }

  await mongoose.connect(uri);
  const { default: User } = await import("../src/models/User");
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email }).select("+passwordHash");

  if (existing) {
    existing.role = "admin";
    existing.provider = "credentials";
    existing.passwordHash = passwordHash;
    existing.emailVerified = existing.emailVerified ?? new Date();
    await existing.save();
    console.log("Administrator account updated.");
  } else {
    await User.create({
      name: "Greenova Administrator",
      email,
      passwordHash,
      provider: "credentials",
      role: "admin",
      emailVerified: new Date(),
    });
    console.log("Administrator account created.");
  }
}

main()
  .catch((error) => {
    console.error("Could not create administrator:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
