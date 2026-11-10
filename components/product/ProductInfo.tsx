
import type {
  Product,
  ProductVariant,
} from "@/data/products";

import { formatPrice, getProductDisplayName } from "@/lib/product";
import ProductActions from "./ProductActions";

export default function ProductInfo({
  product,
  selectedVariant,
  onVariantChange,
}: {
  product: Product;
  selectedVariant?: ProductVariant | null;
  onVariantChange?: (
    variant: ProductVariant
  ) => void;
}) {
  const collection =
    product.collection ?? "Wolves Territory";

  const hasVariants =
    (product.variants?.length ?? 0) > 0;

  return (
    <section className="bg-[#f4f1eb] text-[#171717]">
      <div className="flex min-h-[calc(100vh-6rem)] items-start px-5 pb-16 pt-12 sm:px-8 md:px-10 lg:items-center lg:px-14 lg:py-20 xl:px-20">
        <div className="mx-auto w-full max-w-[580px]">

          {/* BRAND / COLLECTION */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#77736c]">
            <span>WOLVES TERRITORY</span>

            <span className="text-[#b1ada5]">
              /
            </span>

            <span>{collection}</span>
          </div>

          {/* PRODUCT NAME */}
          <h1 className="mt-5 max-w-[540px] text-[clamp(2rem,3.5vw,3.6rem)] font-semibold uppercase leading-[1.02] tracking-[-0.045em]">
            {getProductDisplayName(product, selectedVariant)}
          </h1>

          {/* PRICE */}
          <p className="mt-4 text-xl font-medium tracking-[-0.025em] sm:text-[22px]">
            {formatPrice(product.price)}
          </p>

          {/* CATEGORY */}
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.13em] text-[#77736c]">
            {product.category}
          </p>

          <div className="mt-7 h-px w-full bg-[#d8d4cc]" />

          {/* PRODUCT DESCRIPTION */}
          <div className="mt-7">
            <p className="max-w-[470px] text-[14px] leading-[1.8] text-[#625e57]">
              {product.description ??
                "Diseñado bajo la filosofía Wolves Territory: identidad, precisión y presencia."}
            </p>
          </div>

          {/* COLOR SELECTION */}
          {hasVariants && (
            <div className="mt-9">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">
                  COLOR
                </p>

                <p className="text-[11px] uppercase tracking-[0.1em] text-[#77736c]">
                  {selectedVariant?.color ??
                    "Seleccionar"}
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-3"
                role="group"
                aria-label="Seleccionar color del producto"
              >
                {product.variants?.map((variant) => {
                  const active =
                    selectedVariant?.slug ===
                    variant.slug;

                  return (
                    <button
                      key={variant.slug}
                      type="button"
                      onClick={() =>
                        onVariantChange?.(variant)
                      }
                      aria-label={`Seleccionar color ${variant.color}`}
                      aria-pressed={active}
                      title={variant.color}
                      className="group flex min-w-11 flex-col items-center gap-2"
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-200 ${
                          active
                            ? "border-[#171717]"
                            : "border-transparent group-hover:border-[#aaa59d]"
                        }`}
                      >
                        <span
                          className="h-7 w-7 rounded-full border border-black/15"
                          style={{
                            backgroundColor:
                              variant.colorHex,
                          }}
                        />
                      </span>

                      <span
                        className={`text-[10px] uppercase tracking-[0.08em] ${
                          active
                            ? "font-semibold text-[#171717]"
                            : "text-[#77736c]"
                        }`}
                      >
                        {variant.color}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXISTING COMMERCE ACTIONS */}
          <div className="mt-9 border-t border-[#d8d4cc] pt-7">
            <ProductActions
              product={product}
              selectedVariant={selectedVariant}
            />
          </div>

          {/* SERVICE / TRUST INFORMATION */}
          <div className="mt-10 border-t border-[#d8d4cc] pt-7">
            <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#77736c]">
              LA EXPERIENCIA WOLVES
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  ENVÍOS
                </p>

                <p className="mt-2 text-[12px] leading-5 text-[#77736c]">
                  Colombia
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  PAGOS
                </p>

                <p className="mt-2 text-[12px] leading-5 text-[#77736c]">
                  Checkout seguro
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  SOPORTE
                </p>

                <p className="mt-2 text-[12px] leading-5 text-[#77736c]">
                  Wolves Care
                </p>
              </div>
            </div>
          </div>

          {/* EDITORIAL SIGNATURE */}
          <div className="mt-10 flex items-center gap-4">
            <span className="h-px w-8 bg-[#aaa59d]" />

            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#77736c]">
              WEAR YOUR TERRITORY
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
