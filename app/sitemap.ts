import type { MetadataRoute } from "next";
import { cities } from "./cities";
import { absoluteUrl } from "./seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const cityPages = Object.entries(cities)
    .filter(([, city]) => city.hasScenes)
    .map(([slug]) => ({ url: absoluteUrl(`/city/${slug}`) }));

  return [{ url: absoluteUrl("/") }, ...cityPages];
}
