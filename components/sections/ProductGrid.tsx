"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { products } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";

const categories = [
  { label: "ALL", value: "all" },
  { label: "HOODIES", value: "Hoodie" },
  { label: "T-SHIRTS", value: "T-Shirt" },
  { label: "POLOS", value: "Polo" },
  { label: "SHORTS", value: "Short" },
  { label: "GORRAS", value: "Cap" },
  { label: "ACCESORIOS", value: "Accessory" },
  { label: "VESTIMENTA", value: "Apparel" },
];

export default function ProductGrid() {
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] =
    useState("all");

  useEffect(() => {
    const category = searchParams.get("category");

    if (!category) return;

    const validCategory = categories.find(
      (item) =>
        item.value.toLowerCase() ===
        category.toLowerCase()
    );

    if (validCategory) {
      setActiveCategory(validCategory.value);
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
  if (activeCategory === "all") {
    return products;
  }

  if (activeCategory === "Apparel") {
    return products.filter((product) =>
      [
        "Hoodie",
        "T-Shirt",
        "Polo",
        "Short",
      ].includes(product.category)
    );
  }

  return products.filter(
    (product) =>
      product.category === activeCategory
  );
}, [activeCategory]);

  return (
    <section
      id="coleccion"
      className="relative bg-[#f2f0eb] text-black"
    >
      {/* EDITORIAL HEADER */}
      <div className="border-b border-black/10 px-5 py-20 md:px-10 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-black" />

            <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-black/50">
              Wolves Territory · Colección 01
            </p>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <h2 className="max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              The
              <br />
              Collection
            </h2>

            <div className="max-w-md lg:justify-self-end">
              <p className="text-sm leading-7 text-black/55">
                Una vestimenta cuidadosamente construida en torno a la identidad,
                la precisión y la presencia.
              </p>

              <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-black/35">
                Medellín · Colombia · 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sticky top-16 z-30 border-b border-black/10 bg-[#f2f0eb]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-5 md:px-10 lg:px-14">
          <div className="flex flex-1 gap-7 overflow-x-auto py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const active = activeCategory === category.value;

              return (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={`relative shrink-0 pb-1 text-[10px] font-semibold tracking-[0.25em] transition-colors ${
                    active
                      ? "text-black"
                      : "text-black/35 hover:text-black"
                  }`}
                >
                  {category.label}

                  {active && (
                    <span className="absolute -bottom-1 left-0 h-px w-full bg-black" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="hidden shrink-0 text-[10px] tracking-[0.22em] text-black/35 md:block">
            {String(filteredProducts.length).padStart(2, "0")} ITEMS
          </p>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="mx-auto max-w-[1600px] px-2 py-2 md:px-4 md:py-4">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-1 gap-y-10 md:grid-cols-3 md:gap-x-2 lg:gap-y-16 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-xs uppercase tracking-[0.3em] text-black/35">
              Collection coming soon
            </p>
          </div>
        )}
      </div>

      {/* COLLECTION FOOTER */}
      <div className="px-5 py-24 md:px-10 lg:px-14 lg:py-32">
        <div className="mx-auto max-w-[1600px] border-t border-black/10 pt-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-black/35">
                Wolves Territory
              </p>

              <p className="mt-4 max-w-xl text-xl font-medium leading-8 md:text-2xl">
                Diseñado para convertirse en parte de tu territorio,
                no solo parte de una temporada.
              </p>
            </div>

            <a
              href="#coleccion"
              className="group flex w-full max-w-xs items-center justify-between border-b border-black/25 pb-4 text-[10px] font-bold uppercase tracking-[0.28em] transition hover:border-black md:w-72"
            >
              Explorar Todo

              <span className="transition-transform duration-300 group-hover:translate-x-2">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}