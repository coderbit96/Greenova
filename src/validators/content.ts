import { z } from "zod";
import { GALLERY_CATEGORIES } from "@/models/GalleryItem";

const image = z.object({ url: z.string().url().max(2_000), publicId: z.string().max(500).optional() });
export const gallerySchema = z.object({ image, title: z.string().trim().min(2).max(160), alt: z.string().trim().min(5).max(300), category: z.enum(GALLERY_CATEGORIES), order: z.coerce.number().int().min(0).default(0) });
export const amenitySchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).optional(), active: z.boolean().default(true), order: z.coerce.number().int().min(0).default(0) });
export const diningSchema = z.object({ name: z.string().trim().min(2).max(140), description: z.string().trim().min(10).max(2_000), openingTime: z.string().trim().min(2).max(40), closingTime: z.string().trim().min(2).max(40), cuisine: z.string().trim().min(2).max(120), images: z.array(image).max(8).default([]), highlights: z.array(z.string().trim().min(1).max(160)).max(12).default([]), active: z.boolean().default(true), order: z.coerce.number().int().min(0).default(0) });
export const enquiryStatusSchema = z.object({ status: z.enum(["NEW", "READ", "REPLIED", "CLOSED"]) });
