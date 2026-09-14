import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { deleteImage } from "@/lib/cloudinary";
import GalleryItem, { type GalleryCategory } from "@/models/GalleryItem";
import Amenity from "@/models/Amenity";
import DiningVenue from "@/models/DiningVenue";
import Enquiry from "@/models/Enquiry";
import { serialize } from "@/utils";
import type { z } from "zod";
import type { amenitySchema, diningSchema, gallerySchema } from "@/validators/content";

export class ContentError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "ContentError"; }
}
type GalleryInput = z.infer<typeof gallerySchema>;
type AmenityInput = z.infer<typeof amenitySchema>;
type DiningInput = z.infer<typeof diningSchema>;

const id = (value: string) => {
  if (!mongoose.isValidObjectId(value)) throw new ContentError(400, "Invalid id.");
};
/**
 * Mongoose lean documents carry ObjectId and Date values that cannot cross
 * the server/client boundary. `serialize` converts them to JSON, so callers
 * receive plain objects with string ids and dates.
 */
const plain = <T>(value: T) => serialize(value) as T;

export async function listGallery(category?: GalleryCategory) {
  await connectDB();
  return plain(await GalleryItem.find(category ? { category } : {}).sort({ order: 1, createdAt: -1 }).lean());
}
export async function createGallery(input: GalleryInput) { await connectDB(); return plain((await GalleryItem.create(input)).toObject()); }
export async function updateGallery(itemId: string, input: Partial<GalleryInput>) { id(itemId); await connectDB(); const item = await GalleryItem.findByIdAndUpdate(itemId, input, { returnDocument: "after", runValidators: true }).lean(); if (!item) throw new ContentError(404, "Gallery image not found."); return plain(item); }
export async function deleteGallery(itemId: string) { id(itemId); await connectDB(); const item = await GalleryItem.findByIdAndDelete(itemId); if (!item) throw new ContentError(404, "Gallery image not found."); if (item.image.publicId) await deleteImage(item.image.publicId).catch(() => undefined); }
export async function reorderGallery(items: Array<{ id: string; order: number }>) {
  await connectDB();
  await Promise.all(
    items.map((item) =>
      GalleryItem.updateOne({ _id: item.id } as never, { $set: { order: item.order } }),
    ),
  );
}

export async function listAmenities(activeOnly = false) { await connectDB(); return plain(await Amenity.find(activeOnly ? { active: true } : {}).sort({ order: 1, name: 1 }).lean()); }
export async function createAmenity(input: AmenityInput) { await connectDB(); return plain((await Amenity.create(input)).toObject()); }
export async function updateAmenity(itemId: string, input: Partial<AmenityInput>) { id(itemId); await connectDB(); const item = await Amenity.findByIdAndUpdate(itemId, input, { returnDocument: "after", runValidators: true }).lean(); if (!item) throw new ContentError(404, "Amenity not found."); return plain(item); }
export async function deleteAmenity(itemId: string) { id(itemId); await connectDB(); if (!await Amenity.findByIdAndDelete(itemId)) throw new ContentError(404, "Amenity not found."); }

export async function listDining(activeOnly = false) { await connectDB(); return plain(await DiningVenue.find(activeOnly ? { active: true } : {}).sort({ order: 1, name: 1 }).lean()); }
export async function createDining(input: DiningInput) { await connectDB(); return plain((await DiningVenue.create(input)).toObject()); }
export async function updateDining(itemId: string, input: Partial<DiningInput>) { id(itemId); await connectDB(); const item = await DiningVenue.findByIdAndUpdate(itemId, input, { returnDocument: "after", runValidators: true }).lean(); if (!item) throw new ContentError(404, "Dining venue not found."); return plain(item); }
export async function deleteDining(itemId: string) { id(itemId); await connectDB(); const item = await DiningVenue.findByIdAndDelete(itemId); if (!item) throw new ContentError(404, "Dining venue not found."); await Promise.allSettled(item.images.map((image) => image.publicId ? deleteImage(image.publicId) : Promise.resolve())); }

export async function createEnquiry(input: { name: string; email: string; phone: string; subject: string; message: string }) { await connectDB(); return plain((await Enquiry.create(input)).toObject()); }
export async function listEnquiries() { await connectDB(); return plain(await Enquiry.find().sort({ createdAt: -1 }).lean()); }
export async function updateEnquiryStatus(itemId: string, status: "NEW" | "READ" | "REPLIED" | "CLOSED") { id(itemId); await connectDB(); const item = await Enquiry.findByIdAndUpdate(itemId, { status }, { returnDocument: "after" }).lean(); if (!item) throw new ContentError(404, "Enquiry not found."); return plain(item); }
