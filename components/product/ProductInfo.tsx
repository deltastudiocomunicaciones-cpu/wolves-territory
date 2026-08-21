import { Product } from "@/data/products";
import { formatPrice } from "@/lib/product";
import ProductActions from "./ProductActions";

export default function ProductInfo({
  product,
}: {
  product: Product;
}) {
  return (
    <section className="bg-[#f4f1eb]">
      <div className="flex min-h-[calc(100vh-6rem)] items-center px-6 py-20 md:px-10 lg:px-16">
        <div className="w-full max-w-xl">

          {/* COLLECTION */}
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-black/40" />

            <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-black/45">
              {product.collection ?? product.category}
            </p>
          </div>

          {/* NAME */}
          <h1 className="mt-7 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] text-black md:text-6xl lg:text-7xl">
            {product.name}
          </h1>

          {/* PRICE */}
          <p className="mt-7 text-base font-medium tracking-tight text-black">
            {formatPrice(product.price)}
          </p>

          {/* META */}
          <div className="mt-10 flex gap-8 border-y border-black/10 py-5">
            <div>
              <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
                Category
              </p>

              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-black">
                {product.category}
              </p>
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
                Collection
              </p>

              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-black">
                {product.collection ?? "Wolves Territory"}
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-10">
            <p className="max-w-lg text-sm leading-7 text-black/55">
              {product.description ??
                "Designed with the Wolves Territory philosophy of identity, precision and presence."}
            </p>
          </div>

          {/* ACTIONS */}
          <ProductActions product={product} />

          {/* TRUST */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-black/10 pt-7">
            <div>
              <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                Shipping
              </p>

              <p className="mt-2 text-[10px] leading-5 text-black/65">
                Colombia
              </p>
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                Payments
              </p>

              <p className="mt-2 text-[10px] leading-5 text-black/65">
                Secure checkout
              </p>
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                Support
              </p>

              <p className="mt-2 text-[10px] leading-5 text-black/65">
                Wolves Care
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}