import { products } from "@/data/products";

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}