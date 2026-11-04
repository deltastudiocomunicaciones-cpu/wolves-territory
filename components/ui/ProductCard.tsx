
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const [activeVariant, setActiveVariant] = useState(0);

  const variants = product.variants ?? [];
  const selectedVariant = variants[activeVariant];

  const productHref = selectedVariant?.slug
    ? `/product/${selectedVariant.slug}`
    : product.slug
      ? `/product/${product.slug}`
      : "#";

  const mainImage = selectedVariant?.image || product.image;

  const gallery =
    selectedVariant?.images?.length
      ? selectedVariant.images
      : product.images?.length
        ? product.images
        : [mainImage];

  const secondaryImage =
    gallery.find((image) => image !== mainImage) ?? mainImage;

  return (
    <article className="group min-w-0">
      {/* PRODUCT PHOTOGRAPHY */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e6df]">
        <Link
          href={productHref}
          aria-label={`Explorar ${product.name}`}
          className="absolute inset-0 block overflow-hidden"
        >
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0 group-focus-within:opacity-0"
          />

          {secondaryImage !== mainImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} — vista alternativa`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
            />
          )}
        </Link>

        {/* SINGLE EDITORIAL LABEL */}
        {product.featured && (
          <span className="pointer-events-none absolute left-3 top-3 bg-[#f6f3ec]/95 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#171717] md:left-4 md:top-4">
            NEW ARRIVAL
          </span>
        )}

        {/* DESKTOP DISCOVERY ACTION */}
        <Link
          href={productHref}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 items-center justify-between bg-[#171717] px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-white opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:flex"
        >
          <span>EXPLORAR PRODUCTO</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* EDITORIAL PRODUCT INFORMATION */}
      <div className="px-1 pb-5 pt-4 md:px-2 md:pt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#77736c]">
          WOLVES TERRITORY
          <span className="mx-1.5 text-[#b1ada5]">/</span>
          {product.collection ?? product.category}
        </p>

        <Link href={productHref} className="mt-2 block">
          <h3 className="text-[14px] font-semibold uppercase leading-[1.35] tracking-[-0.015em] text-[#171717] transition-colors group-hover:text-[#565149] md:text-[16px]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1.5 text-[14px] font-medium tracking-[-0.015em] text-[#171717] md:text-[15px]">
          {formatPrice(product.price)}
        </p>

        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#77736c]">
          {product.category}
        </p>

        {/* PRODUCT COLOR VARIANTS */}
        {variants.length > 1 && (
          <div
            className="mt-4 flex flex-wrap items-center gap-2"
            aria-label={`Colores disponibles de ${product.name}`}
          >
            {variants.map((variant, index) => {
              const isActive = index === activeVariant;

              return (
                <button
                  key={`${variant.slug}-${index}`}
                  type="button"
                  onClick={() => setActiveVariant(index)}
                  aria-label={`Ver color ${variant.color}`}
                  aria-pressed={isActive}
                  title={variant.color}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    isActive
                      ? "border-[#171717]"
                      : "border-transparent hover:border-[#aaa59d]"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-black/15"
                    style={{
                      backgroundColor: variant.colorHex,
                    }}
                  />
                </button>
              );
            })}

            <span className="ml-1 text-[10px] uppercase tracking-[0.1em] text-[#77736c]">
              {selectedVariant?.color}
            </span>
          </div>
        )}

        {/* MOBILE-FRIENDLY DISCOVERY LINK */}
        <Link
          href={productHref}
          className="mt-5 flex items-center justify-between border-t border-[#d8d4cc] pt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#171717] transition-colors hover:text-[#77736c]"
        >
          <span>EXPLORAR PRODUCTO</span>
          <span aria-hidden="true" className="text-base">
            ↗
          </span>
        </Link>
      </div>
    </article>
  );
}
