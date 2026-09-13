import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { serialize } from "@/utils";
import type { UserDTO } from "@/types/models";
import type { ProfileInput } from "@/validators/account";

const BCRYPT_ROUNDS = 12;

export class UserError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<UserDTO> {
  await connectDB();

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new UserError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    provider: "credentials",
    role: "customer",
  });

  return serialize(user.toObject()) as unknown as UserDTO;
}

/** Verifies credentials for the NextAuth authorize() callback. */
export async function verifyCredentials(email: string, password: string) {
  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");

  // OAuth-only accounts have no hash; reject rather than throw.
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

/** Creates or updates the local record backing a Google sign-in. */
export async function upsertOAuthUser(profile: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<void> {
  await connectDB();

  const existing = await User.findOne({ email: profile.email });
  if (existing) {
    if (!existing.image && profile.image) {
      existing.image = profile.image;
      await existing.save();
    }
    return;
  }

  await User.create({
    name: profile.name ?? profile.email.split("@")[0],
    email: profile.email,
    image: profile.image ?? undefined,
    provider: "google",
    role: "customer",
    emailVerified: new Date(),
  });
}

export async function getUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email });
}

/** Fetch by immutable id so session refreshes still work after an email change. */
export async function getUserById(id: string) {
  await connectDB();
  return User.findById(id);
}

export async function updateUserProfile(userId: string, input: ProfileInput): Promise<UserDTO> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new UserError(404, "Account not found.");

  if (user.email !== input.email) {
    if (user.provider === "google") {
      throw new UserError(400, "Your email address is managed by your Google account.");
    }
    const emailInUse = await User.exists({ email: input.email, _id: { $ne: user._id } });
    if (emailInUse) throw new UserError(409, "An account with this email already exists.");
    user.email = input.email;
  }

  user.name = input.name;
  user.phone = input.phone;
  user.image = input.image;
  await user.save();

  return serialize(user.toObject()) as unknown as UserDTO;
}
