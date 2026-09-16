import "server-only";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { serialize } from "@/utils";
import type { PopulatedBookingDTO, UserDTO } from "@/types/models";
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

/**
 * Resolves a Firebase identity to the local booking account. The UID comes
 * only from a Firebase Admin-verified token; the browser never chooses it.
 */
export async function upsertFirebaseUser(profile: {
  uid: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified: boolean;
}) {
  await connectDB();

  const email = profile.email.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.firebaseUid && existing.firebaseUid !== profile.uid) {
      throw new UserError(409, "This email is already linked to a different account.");
    }
    // Do not let an unverified Firebase address claim a pre-existing local
    // account that happens to use the same email address.
    if (!existing.firebaseUid && !profile.emailVerified) {
      throw new UserError(409, "Verify this email address before linking your account.");
    }

    existing.firebaseUid = profile.uid;
    if (!existing.image && profile.image) existing.image = profile.image;
    if (!existing.emailVerified && profile.emailVerified) existing.emailVerified = new Date();
    await existing.save();

    return {
      id: String(existing._id),
      name: existing.name,
      email: existing.email,
      image: existing.image,
      role: existing.role,
    };
  }

  const user = await User.create({
    name: profile.name?.trim() || email.split("@")[0],
    email,
    image: profile.image ?? undefined,
    provider: "firebase",
    firebaseUid: profile.uid,
    role: "customer",
    emailVerified: profile.emailVerified ? new Date() : null,
  });

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
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
    if (user.provider !== "credentials" || user.firebaseUid) {
      throw new UserError(400, "Your email address is managed by your sign-in provider.");
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


/* --- Admin: people ------------------------------------------------------ */

export interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  provider: "credentials" | "google" | "firebase";
  createdAt: string;
  /** Bookings that were not cancelled. */
  bookingCount: number;
  /** Paise actually collected from this guest. */
  totalSpend: number;
}

/**
 * Registered guests with their booking history joined in, so the admin list
 * shows value per customer rather than just a name.
 */
export async function listCustomers(): Promise<CustomerRow[]> {
  await connectDB();

  const rows = await User.aggregate([
    { $match: { role: "customer" } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "bookings",
        localField: "_id",
        foreignField: "user",
        as: "bookings",
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        provider: 1,
        createdAt: 1,
        bookingCount: {
          $size: {
            $filter: {
              input: "$bookings",
              as: "b",
              cond: { $ne: ["$$b.status", "cancelled"] },
            },
          },
        },
        totalSpend: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$bookings",
                  as: "b",
                  cond: { $eq: ["$$b.payment.status", "paid"] },
                },
              },
              as: "b",
              in: "$$b.totalAmount",
            },
          },
        },
      },
    },
  ]);

  return serialize(rows) as unknown as CustomerRow[];
}

export async function getAdminCustomerDetail(id: string): Promise<{
  user: UserDTO;
  bookings: PopulatedBookingDTO[];
  completedStays: number;
  cancelledStays: number;
  totalSpend: number;
} | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const [user, bookings] = await Promise.all([
    User.findOne({ _id: id, role: "customer" }).lean(),
    Booking.find({ user: id }).populate("room", "name category slug images").sort({ createdAt: -1 }).lean(),
  ]);
  if (!user) return null;

  const completedStays = bookings.filter((booking) => booking.status === "completed").length;
  const cancelledStays = bookings.filter((booking) => booking.status === "cancelled").length;
  const totalSpend = bookings
    .filter((booking) => booking.payment.status === "paid")
    .reduce((sum, booking) => sum + booking.totalAmount, 0);
  return {
    user: serialize(user) as unknown as UserDTO,
    bookings: serialize(bookings) as unknown as PopulatedBookingDTO[],
    completedStays,
    cancelledStays,
    totalSpend,
  };
}

/** Accounts holding the administrator role. */
export async function listAdmins(): Promise<UserDTO[]> {
  await connectDB();
  const admins = await User.find({ role: "admin" }).sort({ createdAt: 1 }).lean();
  return serialize(admins) as unknown as UserDTO[];
}
