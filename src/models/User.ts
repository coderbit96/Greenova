import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  phone?: string;
  role: "customer" | "admin";
  provider: "credentials" | "google" | "firebase";
  firebaseUid?: string;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Absent for OAuth accounts. `select: false` keeps the hash out of
    // every query result unless explicitly requested.
    passwordHash: { type: String, select: false },
    image: { type: String },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer", index: true },
    provider: { type: String, enum: ["credentials", "google", "firebase"], default: "credentials" },
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    emailVerified: { type: Date, default: null },
  },
  { timestamps: true },
);

const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
export default User;
