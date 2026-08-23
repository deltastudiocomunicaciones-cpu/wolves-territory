"use client";

import { useState } from "react";
import {
  Product,
  ProductVariant,
} from "@/data/products";
import { useCart } from "@/components/cart/CartProvider";

export default function ProductActions({
  product,
  selectedVariant,
}: {
  product: Product;
  selectedVariant?: ProductVariant | null;
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  const requiresSize =
    product.category !== "Cap" &&
    product.category !== "Accessory";

  const sizes = ["M", "L", "XL", "XXL"];
  const selectedColor =
  selectedVariant?.color ?? null;

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function handleAddToBag() {
    if (requiresSize && !selectedSize) {
      alert("Selecciona una talla antes de continuar.");
      return;
    }

    const sku =
  requiresSize
    ? selectedVariant?.skuBase &&
      selectedSize
      ? `${selectedVariant.skuBase}-${selectedSize}`
      : null
    : selectedVariant?.skuBase ?? null;

   addItem(
  product,
  quantity,
  selectedSize,
  selectedColor,
  sku
);
  }

  function handleBuyNow() {
    if (requiresSize && !selectedSize) {
      alert("Selecciona una talla antes de continuar.");
      return;
    }

    console.log("BUY NOW", {
      product,
      quantity,
      size: selectedSize,
    });
  }

  return (
    <div className="mt-10">
      {/* SIZE */}
      {requiresSize && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-black">
              Select Size
            </p>

            <button
              type="button"
              className="text-[9px] uppercase tracking-[0.2em] text-black/40 underline-offset-4 transition hover:text-black hover:underline"
            >
              Size Guide
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {sizes.map((size) => {
              const active = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`h-12 border text-[10px] font-medium uppercase tracking-[0.18em] transition ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-transparent text-black hover:border-black"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUANTITY */}
      <div className={requiresSize ? "mt-8" : ""}>
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.26em] text-black">
          Quantity
        </p>

        <div className="flex h-12 w-36 items-center justify-between border border-black/15">
          <button
            type="button"
            onClick={decreaseQuantity}
            className="flex h-full w-12 items-center justify-center text-lg text-black/60 transition hover:text-black"
          >
            −
          </button>

          <span className="text-[11px] font-medium">
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            className="flex h-full w-12 items-center justify-center text-lg text-black/60 transition hover:text-black"
          >
            +
          </button>
        </div>
      </div>

      {/* STOCK */}
      <div className="mt-7 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-emerald-600" />

        <p className="text-[9px] uppercase tracking-[0.22em] text-black/45">
          Available · Ready to ship
        </p>
      </div>

      {/* CTAS */}
      <div className="mt-7 space-y-3">
        <button
          type="button"
          onClick={handleAddToBag}
          className="group flex w-full items-center justify-between bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black"
        >
          Add to Bag

          <span className="transition-transform duration-300 group-hover:translate-x-1">
            +
          </span>
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          className="flex w-full items-center justify-center border border-black/20 px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-black transition hover:border-black"
        >
          Buy Now
        </button>
      </div>

      {/* MICROCOPY */}
      <div className="mt-6 space-y-2">
        <p className="text-[9px] leading-5 tracking-[0.08em] text-black/40">
          Secure payments powered by Wompi.
        </p>

        <p className="text-[9px] leading-5 tracking-[0.08em] text-black/40">
          Shipping available throughout Colombia.
        </p>
      </div>
    </div>
  );
}