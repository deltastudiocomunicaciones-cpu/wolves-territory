import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const origin = "https://www.wolves-territory.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = Array.from(new Set(products.flatMap((product) => [
    product.slug,
    ...(product.variants?.map((variant) => variant.slug) ?? []),
  ])));

  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    ...slugs.map((slug) => ({
      url: `${origin}/product/${encodeURIComponent(slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
