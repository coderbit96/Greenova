import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.email("Enter a valid email address"),
  subject: z.string().min(2).max(160),
  message: z.string().min(10, "Please write a little more").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
