import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20)
  .regex(/^[+\d][\d\s()-]*$/, "Enter a valid phone number");

const supportedImageUrl = z
  .url("Enter a valid image URL")
  .refine(
    (value) =>
      ["res.cloudinary.com", "images.unsplash.com", "lh3.googleusercontent.com"].includes(
        new URL(value).hostname,
      ),
    "Use a Cloudinary, Unsplash or Google profile image URL",
  );

/** Details a signed-in guest may maintain on their own account. */
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.email("Enter a valid email address").toLowerCase(),
  phone: z.union([z.literal(""), phone]).transform((value) => value || undefined),
  image: z
    .union([z.literal(""), supportedImageUrl])
    .transform((value) => value || undefined),
});

export type ProfileInput = z.infer<typeof profileSchema>;
