"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const {
    items,
    subtotal,
    removeItem,
    updateQuantity,
  } = useCart();

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* DRAWER */}
      <aside
        className={`fixed right-0 top-0 z-[100] flex h-screen w-full max-w-md flex-col bg-[#f4f1eb] text-black shadow-2xl transition-transform duration-500 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.32em] text-black/40">
              Wolves Territory
            </p>

            <h2 className="mt-2 text-lg font-semibold uppercase tracking-[-0.02em]">
              Your Bag
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center text-xl text-black/45 transition hover:text-black"
          >
            ×
          </button>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/35">
                Your bag is empty
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 border-b border-black pb-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {items.map((item) => (
                <div
                  key={
                    item.sku ??
                    `${item.product.id}-${item.color ?? "default"}-${item.size ?? "default"}`
                  }
                  className="grid grid-cols-[96px_1fr] gap-5 border-b border-black/10 pb-8"
                >
                  {/* IMAGE */}
                  <div className="aspect-[4/5] overflow-hidden bg-[#e9e6df]">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* INFO */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
                        {item.product.collection ??
                          item.product.category}
                      </p>

                      <h3 className="mt-2 text-xs font-semibold uppercase tracking-[0.08em]">
                        {item.product.name}
                      </h3>

                      {/* COLOR + SIZE */}
                      {(item.color || item.size) && (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {item.color && (
                            <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                              Color {item.color}
                            </p>
                          )}

                          {item.size && (
                            <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                              Size {item.size}
                            </p>
                          )}
                        </div>
                      )}

                      {/* SKU */}
                      {item.sku && (
                        <p className="mt-2 text-[8px] uppercase tracking-[0.18em] text-black/25">
                          SKU {item.sku}
                        </p>
                      )}

                      <p className="mt-3 text-xs font-medium">
                        {formatPrice(
                          item.product.price
                        )}
                      </p>
                    </div>

                    {/* QUANTITY / REMOVE */}
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex h-9 items-center border border-black/15">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.size,
                              item.color,
                              item.sku
                            )
                          }
                          className="h-full w-9 text-sm text-black/50 transition hover:text-black"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-[10px]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.size,
                              item.color,
                              item.sku
                            )
                          }
                          className="h-full w-9 text-sm text-black/50 transition hover:text-black"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(
                            item.product.id,
                            item.size,
                            item.color,
                            item.sku
                          )
                        }
                        className="text-[8px] uppercase tracking-[0.2em] text-black/35 underline-offset-4 transition hover:text-black hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {items.length > 0 && (
          <div className="border-t border-black/10 px-6 py-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.24em] text-black/45">
                Subtotal
              </span>

              <span className="text-sm font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/checkout");
              }}
              className="w-full bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black"
            >
              Checkout
            </button>

            <p className="mt-4 text-center text-[8px] uppercase tracking-[0.2em] text-black/35">
              Shipping calculated at checkout
            </p>
          </div>
        )}
      </aside>
    </>
  );
}