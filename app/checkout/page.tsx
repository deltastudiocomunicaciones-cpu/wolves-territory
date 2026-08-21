import Link from "next/link";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";

export const metadata = {
  title: "Checkout | Wolves Territory",
  description:
    "Finaliza tu compra de Wolves Territory de forma segura.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#f4f1eb] text-black">
      <header className="border-b border-black/10 px-6 py-6 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link
            href="/"
            className="text-[12px] font-semibold uppercase tracking-[0.24em]"
          >
            Wolves Territory
          </Link>

          <Link
            href="/#coleccion"
            className="text-[9px] uppercase tracking-[0.22em] text-black/40 transition hover:text-black"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1600px] lg:grid-cols-[1.1fr_0.9fr]">
        <CheckoutForm />
        <OrderSummary />
      </section>
    </main>
  );
}