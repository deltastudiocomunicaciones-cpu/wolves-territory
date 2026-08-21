"use client";

import { useCart } from "@/components/cart/CartProvider";

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OrderSummary() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
  return (
    <aside className="flex min-h-[60vh] items-center justify-center bg-[#ebe8e1] px-6">
      <div className="max-w-sm text-center">
        <p className="text-[9px] uppercase tracking-[0.32em] text-black/35">
          Wolves Territory
        </p>

        <h2 className="mt-5 text-3xl font-semibold uppercase tracking-[-0.03em]">
          Your bag is empty
        </h2>

        <p className="mt-4 text-sm leading-6 text-black/45">
          Add a product before continuing with your order.
        </p>

        <a
          href="/#coleccion"
          className="mt-8 inline-flex border-b border-black pb-2 text-[9px] font-semibold uppercase tracking-[0.25em]"
        >
          Return to collection
        </a>
      </div>
    </aside>
  );
}

  return (
    <aside className="border-l border-black/10 bg-[#ebe8e1] px-6 py-12 md:px-10 lg:min-h-[calc(100vh-81px)] lg:px-14">
      <div className="mx-auto max-w-xl">
        <p className="text-[9px] uppercase tracking-[0.32em] text-black/35">
          Order Summary
        </p>

        <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.03em]">
          Your Bag
        </h2>

        <div className="mt-10 space-y-7">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.size ?? "default"}`}
              className="grid grid-cols-[80px_1fr] gap-5 border-b border-black/10 pb-7"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#dedbd4]">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />

                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[8px] text-white">
                  {item.quantity}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.23em] text-black/35">
                    {item.product.collection ?? item.product.category}
                  </p>

                  <h3 className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    {item.product.name}
                  </h3>

                  {item.size && (
                    <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-black/40">
                      Size {item.size}
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-[11px] font-medium">
                  {formatPrice(
                    item.product.price * item.quantity
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-black/45">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-black/45">
            <span>Shipping</span>
            <span>Calculated next</span>
          </div>

          <div className="border-t border-black/15 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Total
              </span>

              <span className="text-lg font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="mt-2 text-right text-[8px] uppercase tracking-[0.2em] text-black/30">
              COP
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}