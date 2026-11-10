import { products } from "@/data/products";

export function getProductBySlug(slug: string) {
  const direct = products.find((product) => product.slug === slug);
  if (direct) return direct;

  // Los colores poseen URL propia. Mantener el tipo de producto y
  // seleccionar la variante correspondiente sin duplicar el catálogo.
  const parent = products.find((product) =>
    product.variants?.some((variant) => variant.slug === slug)
  );
  if (!parent) return undefined;

  const selected = parent.variants?.find((variant) => variant.slug === slug);
  if (!selected) return parent;

  return {
    ...parent,
    variants: [selected, ...(parent.variants ?? []).filter((variant) => variant.slug !== slug)],
  };
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
