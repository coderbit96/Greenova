import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Phone is required").max(30),
  subject: z.string().min(2).max(160),
  message: z.string().min(10, "Please write a little more").max(2000),
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
