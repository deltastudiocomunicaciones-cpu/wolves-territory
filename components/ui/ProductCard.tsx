"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/data/products";

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
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={product.slug ? `/product/${product.slug}` : "#"}
      className="block"
    >
      <article
        className="group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ece9e2]">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          />

          {/* BADGES */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.featured && (
              <span className="w-fit bg-black px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white">
                New
              </span>
            )}

            {product.collection && (
              <span className="w-fit bg-white/90 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.2em] text-black backdrop-blur">
                {product.collection}
              </span>
            )}
          </div>

          {/* QUICK ADD */}
          <div
            className={`absolute inset-x-3 bottom-3 transition-all duration-300 ${
              hovered
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex w-full items-center justify-between bg-black px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#c9a96e] hover:text-black"
            >
              Quick Add
              <span>+</span>
            </button>
          </div>
        </div>

        <div className="px-1 pb-3 pt-4">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/40">
                {product.collection ?? product.category}
              </p>

              <h3 className="mt-2 truncate text-[12px] font-semibold uppercase tracking-[0.08em] text-black md:text-[13px]">
                {product.name}
              </h3>

              <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-black/35">
                {product.category}
              </p>
            </div>

            <p className="shrink-0 text-[12px] font-medium text-black">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}