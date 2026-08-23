"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function CheckoutForm() {
  const { items } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const customer = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      document: String(formData.get("document") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      addressExtra: String(
        formData.get("addressExtra") ?? ""
      ).trim(),
      city: String(formData.get("city") ?? "").trim(),
      department: String(
        formData.get("department") ?? ""
      ).trim(),
    };

   const partnerCode =
  typeof window !== "undefined"
    ? localStorage.getItem(
        "wolves_partner_ref"
      )
    : null; 

    const checkoutItems = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      size: item.size ?? null,
    }));

    try {
      setLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: checkoutItems,
          customer,
          partnerCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "No fue posible preparar el pago."
        );
      }

      const wompiForm = document.createElement("form");

wompiForm.method = "GET";
wompiForm.action = "https://checkout.wompi.co/p/";

const fields: Record<string, string> = {
  "public-key": data.publicKey,
  currency: data.currency,
  "amount-in-cents": String(data.amountInCents),
  reference: data.reference,
  "signature:integrity": data.integritySignature,
};

Object.entries(fields).forEach(([name, value]) => {
  const input = document.createElement("input");

  input.type = "hidden";
  input.name = name;
  input.value = value;

  wompiForm.appendChild(input);
});

document.body.appendChild(wompiForm);

wompiForm.submit();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible preparar el pago."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-6 py-12 md:px-10 lg:px-14 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-[9px] uppercase tracking-[0.32em] text-black/35">
          Secure Checkout
        </p>

        <h1 className="mt-4 text-4xl font-semibold uppercase leading-none tracking-[-0.04em] md:text-5xl">
          Shipping
          <br />
          Information
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-12 space-y-8"
        >
          {/* CONTACT */}
          <div>
            <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.25em]">
              Contact
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                autoComplete="given-name"
                required
                className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />

              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                autoComplete="family-name"
                required
                className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                required
                className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone / WhatsApp"
                autoComplete="tel"
                required
                className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* DELIVERY */}
          <div className="border-t border-black/10 pt-8">
            <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.25em]">
              Delivery Address
            </p>

            <div className="space-y-4">
              <input
                type="text"
                name="address"
                placeholder="Address"
                autoComplete="street-address"
                required
                className="h-14 w-full border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />

              <input
                type="text"
                name="addressExtra"
                placeholder="Apartment, unit or additional information"
                className="h-14 w-full border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  autoComplete="address-level2"
                  required
                  className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
                />

                <input
                  type="text"
                  name="department"
                  placeholder="Department"
                  autoComplete="address-level1"
                  required
                  className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
                />
              </div>

              <input
                type="text"
                name="document"
                placeholder="Documento / NIT"
                required
                className="h-14 w-full border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* PAYMENT */}
          <div className="border-t border-black/10 pt-8">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em]">
              Payment
            </p>

            <p className="max-w-lg text-xs leading-6 text-black/45">
              Serás dirigido a nuestra pasarela de pago segura
              para completar tu compra.
            </p>

            {error && (
              <div className="mt-5 border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs text-red-700">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="mt-7 flex w-full items-center justify-between bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Preparing Secure Payment..."
                : "Continue to Payment"}

              <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}