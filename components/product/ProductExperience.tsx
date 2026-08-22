"use client";

import { useState } from "react";

import {
  Product,
  ProductVariant,
} from "@/data/products";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default function ProductExperience({
  product,
}: {
  product: Product;
}) {
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(
      product.variants?.[0] ?? null
    );

  /*
   * PRODUCTO VISUAL
   *
   * Cambiamos imágenes según el color,
   * pero ProductGallery conserva exactamente
   * su arquitectura original.
   */
  const displayProduct: Product = selectedVariant
  ? {
      ...product,
      image: selectedVariant.image,
      images:
        selectedVariant.images.length > 0
          ? selectedVariant.images
          : [selectedVariant.image],
    }
  : product;
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      
      {/* LEFT — PRODUCT IMAGE */}
      <ProductGallery
        product={displayProduct}
      />

      {/* RIGHT — PRODUCT INFORMATION */}
      <ProductInfo
        product={product}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
      />
      
    </section>
  );
}