import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const baseUrl = "https://www.wolves-territory.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set<string>(["/"]);
  for (const product of products) {
    paths.add(`/product/${product.slug}`);
    for (const variant of product.variants ?? []) {
      paths.add(`/product/${variant.slug}`);
    }
  }
  return [...paths].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
