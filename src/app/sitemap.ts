import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://aura.example.com";
  const routes = ["", "/auth/signup", "/dashboard"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
