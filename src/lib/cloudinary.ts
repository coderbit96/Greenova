import { v2 as cloudinary } from "cloudinary";

export const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImage(fileBuffer: Buffer, folder = "greenova/rooms") {
  if (!cloudinaryEnabled) throw new Error("Cloudinary is not configured");

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(fileBuffer);
  });
}

export async function deleteImage(publicId: string) {
  if (!cloudinaryEnabled) return;
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
