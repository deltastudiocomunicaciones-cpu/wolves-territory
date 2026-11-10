import { products, type Product, type ProductVariant } from "@/data/products";

export type ProductPageData = {
  product: Product;
  selectedVariant: ProductVariant | null;
};

/**
 * Resolves both the canonical product slug and every color-variant slug.
 * Move the requested variant to the first position so ProductExperience
 * displays the correct image and color at first render.
 */
export function getProductPageData(slug: string): ProductPageData | null {
  const product = products.find((item) =>
    item.slug === slug || item.variants?.some((variant) => variant.slug === slug)
  );

  if (!product) return null;

  const selectedVariant =
    product.variants?.find((variant) => variant.slug === slug) ??
    product.variants?.[0] ??
    null;

  const variants = selectedVariant && product.variants
    ? [selectedVariant, ...product.variants.filter((variant) => variant.slug !== selectedVariant.slug)]
    : product.variants;

  return { product: variants ? { ...product, variants } : product, selectedVariant };
}

/**
 * A single product represents multiple colorways in the catalog. The display
 * name must match the selected variant on both the page and search metadata.
 */
export function getProductDisplayName(product: Product, variant?: ProductVariant | null): string {
  if (!variant) return product.name;

  const baseName = product.name.trim();
  const color = variant.color.trim();
  if (baseName.toLocaleLowerCase("es-CO").endsWith(color.toLocaleLowerCase("es-CO"))) return baseName;

  const defaultColor = product.variants?.find((item) => item.slug === product.slug)?.color ??
    product.variants?.[0]?.color;

  if (defaultColor) {
    const expression = new RegExp(`\\s+${defaultColor.replace(/[.*+?^${}()|[\\]\\]/g, "\\export function getProductBySlug(slug: string): Product | undefined {")}import { products, type Product, type ProductVariant } from "@/data/products";

export type ProductPageData = {
  product: Product;
  selectedVariant: ProductVariant | null;
};

/**
 * Resolves both the canonical product slug and every color-variant slug.
 * Move the requested variant to the first position so ProductExperience
 * displays the correct image and color at first render.
 */
export function getProductPageData(slug: string): ProductPageData | null {
  const product = products.find((item) =>
    item.slug === slug || item.variants?.some((variant) => variant.slug === slug)
  );

  if (!product) return null;

  const selectedVariant =
    product.variants?.find((variant) => variant.slug === slug) ??
    product.variants?.[0] ??
    null;

  const variants = selectedVariant && product.variants
    ? [selectedVariant, ...product.variants.filter((variant) => variant.slug !== selectedVariant.slug)]
    : product.variants;

  return { product: variants ? { ...product, variants } : product, selectedVariant };
}

, "i");
    if (expression.test(baseName)) return baseName.replace(expression, ` ${color}`);
  }

  return `${baseName} ${color}`;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProductPageData(slug)?.product;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
