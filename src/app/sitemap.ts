import type { MetadataRoute } from "next";
import { listRoomSitemapEntries } from "@/services/room.service";

const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/rooms`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/availability`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/offers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/offers/weekend-getaway`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/amenities`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/dining`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/gallery`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/policies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Room pages are the money pages — include each live one.
  try {
    const rooms = await listRoomSitemapEntries();

    return [
      ...staticRoutes,
      ...rooms.map((room) => ({
        url: `${baseUrl}/rooms/${room.slug}`,
        lastModified: room.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A database outage should not break the sitemap entirely.
    return staticRoutes;
  }
}
