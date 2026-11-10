"use client";

import { useState } from "react";
import { Product, ProductVariant } from "@/data/products";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default function ProductExperience({
  product,
  initialSlug,
}: {
  product: Product;
  initialSlug?: string;
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.find((variant) => variant.slug === initialSlug) ??
      product.variants?.[0] ??
      null
  );

  const displayProduct: Product = selectedVariant
    ? {
        ...product,
        image: selectedVariant.image,
        images: selectedVariant.images.length > 0
          ? selectedVariant.images
          : [selectedVariant.image],
      }
    : product;

  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <ProductGallery product={displayProduct} />
      <ProductInfo
        product={product}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
      />
    </section>
  );
}
