import { products, type Product, type ProductVariant } from "@/data/products";

export function getProductBySlug(slug: string): Product | undefined {
  const product = products.find((item) =>
    item.slug === slug || item.variants?.some((variant) => variant.slug === slug)
  );
  if (!product) return undefined;

  const selected = product.variants?.find((variant) => variant.slug === slug);
  if (!selected) return product;

  return {
    ...product,
    variants: [selected, ...(product.variants ?? []).filter((variant) => variant.slug !== slug)],
  };
}

/** Preserve the exact catalog item while naming its selected color accurately. */
export function getProductDisplayName(product: Product, variant?: ProductVariant | null): string {
  if (!variant) return product.name;
  const name = product.name.trim();
  const color = variant.color.trim();
  if (name.toLocaleLowerCase("es-CO").endsWith(color.toLocaleLowerCase("es-CO"))) return name;

  const originalColor =
    product.variants?.find((item) => item.slug === product.slug)?.color ??
    product.variants?.[0]?.color;

  if (originalColor && name.toLocaleLowerCase("es-CO").endsWith(
    (" " + originalColor).toLocaleLowerCase("es-CO")
  )) {
    return name.slice(0, -originalColor.length).trimEnd() + " " + color;
  }
  return name + " " + color;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
