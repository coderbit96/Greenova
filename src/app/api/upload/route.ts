import { uploadImage, cloudinaryEnabled } from "@/lib/cloudinary";
import { requireAdmin, errorResponse, HttpError } from "@/lib/guards";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: Request) {
  try {
    await requireAdmin();

    if (!cloudinaryEnabled) {
      throw new HttpError(
        501,
        "Image uploads need Cloudinary credentials in .env. You can paste image URLs instead.",
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file provided.");
    if (!ALLOWED.includes(file.type)) throw new HttpError(400, "Only JPEG, PNG, WebP or AVIF.");
    if (file.size > MAX_BYTES) throw new HttpError(400, "Image must be under 5 MB.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer);

    return Response.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
