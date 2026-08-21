"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { useCart } from "@/components/cart/CartProvider";

type PaymentState =
  | "loading"
  | "approved"
  | "pending"
  | "declined"
  | "error";

/*
 * CONTENIDO DINÁMICO
 *
 * useSearchParams vive aquí dentro
 * para poder protegerlo con Suspense.
 */
function PaymentResultContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] =
    useState<PaymentState>("loading");

  const [reference, setReference] =
    useState("");

  const [amount, setAmount] =
    useState<number | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      const transactionId =
        searchParams.get("id");

      if (!transactionId) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `/api/wompi/transaction/${encodeURIComponent(
            transactionId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        /*
         * BLINDAJE:
         * evitamos intentar interpretar HTML como JSON.
         */
        const contentType =
          response.headers.get(
            "content-type"
          );

        if (
          !contentType?.includes(
            "application/json"
          )
        ) {
          throw new Error(
            "La API devolvió una respuesta inesperada."
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "No fue posible verificar la transacción."
          );
        }

        setReference(
          data.reference ?? ""
        );

        setAmount(
          data.amountInCents ?? null
        );

        switch (data.status) {
          case "APPROVED":
            setStatus("approved");

            /*
             * Solo vaciamos el carrito
             * después de verificar APPROVED
             * directamente con Wompi.
             */
            clearCart();
            break;

          case "PENDING":
            setStatus("pending");
            break;

          case "DECLINED":
          case "VOIDED":
          case "ERROR":
            setStatus("declined");
            break;

          default:
            setStatus("error");
        }
      } catch (error) {
        console.error(
          "Payment verification error:",
          error
        );

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

        {/* BRAND */}
        <p className="text-[9px] uppercase tracking-[0.35em] text-black/35">
          Wolves Territory
        </p>

        {/* LOADING */}
        {status === "loading" && (
          <>
            <div className="mx-auto mt-10 h-10 w-10 animate-spin rounded-full border border-black/15 border-t-black" />

            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Verifying Payment
            </h1>

            <p className="mt-5 text-sm text-black/45">
              Estamos confirmando tu transacción
              directamente con Wompi.
            </p>
          </>
        )}

        {/* APPROVED */}
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

        {/* PENDING */}
        {status === "pending" && (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-black/25 text-xl">
              …
            </div>

            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Payment Pending
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              Wompi está procesando tu pago.
              Tu carrito se conservará mientras
              recibimos la confirmación.
            </p>

            {reference && (
              <p className="mt-5 text-[9px] uppercase tracking-[0.24em] text-black/35">
                {reference}
              </p>
            )}
          </>
        )}

        {/* DECLINED */}
        {status === "declined" && (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-black/20 text-xl">
              ×
            </div>

            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Payment Not Approved
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              El pago no fue aprobado. Tu carrito
              permanece intacto para que puedas
              intentarlo nuevamente.
            </p>
          </>
        )}

        {/* ERROR */}
        {status === "error" && (
          <>
            <h1 className="mt-8 text-4xl font-semibold uppercase tracking-[-0.04em]">
              Verification Error
            </h1>

            <p className="mt-5 text-sm leading-7 text-black/50">
              No pudimos verificar el estado del
              pago en este momento.
            </p>
          </>
        )}

        {/* ACTIONS */}
        {status !== "loading" && (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#coleccion"
              className="bg-black px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#c9a96e] hover:text-black"
            >
              Continue Shopping
            </Link>

            {(status === "declined" ||
              status === "error") && (
              <Link
                href="/checkout"
                className="border border-black/20 px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] transition hover:border-black"
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

/*
 * FALLBACK PARA BUILD / HYDRATION
 */
function PaymentResultFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1eb] px-6 text-black">
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-[0.35em] text-black/35">
          Wolves Territory
        </p>

        <div className="mx-auto mt-10 h-10 w-10 animate-spin rounded-full border border-black/15 border-t-black" />

        <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-black/40">
          Loading secure payment
        </p>
      </div>
    </main>
  );
}

/*
 * PAGE
 *
 * Suspense permite a Next producir el build
 * aunque useSearchParams dependa del navegador.
 */
export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={<PaymentResultFallback />}
    >
      <PaymentResultContent />
    </Suspense>
  );
}