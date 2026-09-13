import type { MetadataRoute } from "next";

const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Guest and operational areas hold personal data and must stay unindexed.
      disallow: ["/admin", "/account", "/booking", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
