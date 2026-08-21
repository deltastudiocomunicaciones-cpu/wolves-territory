"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

type PaymentState =
  | "loading"
  | "approved"
  | "pending"
  | "declined"
  | "error";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] =
    useState<PaymentState>("loading");

  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      const transactionId = searchParams.get("id");

      if (!transactionId) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `/api/wompi/transaction/${transactionId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "No fue posible verificar la transacción."
          );
        }

        setReference(data.reference ?? "");
        setAmount(data.amountInCents ?? null);

        switch (data.status) {
          case "APPROVED":
            setStatus("approved");
            clearCart();
            break;

          case "PENDING":
            setStatus("pending");
            break;

          case "DECLINED":
          case "VOIDED":
            setStatus("declined");
            break;

          default:
            setStatus("error");
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }

    verifyPayment();
  }, [searchParams, clearCart]);

  const formattedAmount =
    amount !== null
      ? new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(amount / 100)
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1eb] px-6 text-black">
      <div className="w-full max-w-xl text-center">
        <p className="text-[9px] uppercase tracking-[0.35em] text-black/35">
          Wolves Territory
        </p>

        {status === "loading" && (
          <>
            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Verifying Payment
            </h1>

            <p className="mt-5 text-sm text-black/45">
              Estamos confirmando tu transacción.
            </p>
          </>
        )}

        {status === "approved" && (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-black">
              ✓
            </div>

            <h1 className="mt-8 text-4xl font-semibold uppercase leading-none tracking-[-0.04em] md:text-5xl">
              Order Confirmed
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              Tu pago fue confirmado correctamente.
            </p>

            {formattedAmount && (
              <p className="mt-8 text-2xl font-semibold">
                {formattedAmount}
              </p>
            )}

            {reference && (
              <p className="mt-3 text-[9px] uppercase tracking-[0.24em] text-black/35">
                {reference}
              </p>
            )}
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Payment Pending
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              Wompi está procesando tu pago. Tu carrito se conservará mientras se confirma.
            </p>
          </>
        )}

        {status === "declined" && (
          <>
            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Payment Not Approved
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              El pago no fue aprobado. Tu carrito sigue intacto para que puedas intentar nuevamente.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Verification Error
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              No pudimos verificar el estado del pago.
            </p>
          </>
        )}

        {status !== "loading" && (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#coleccion"
              className="bg-black px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white"
            >
              Continue Shopping
            </Link>

            {(status === "declined" ||
              status === "error") && (
              <Link
                href="/checkout"
                className="border border-black/20 px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.24em]"
              >
                Try Again
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}