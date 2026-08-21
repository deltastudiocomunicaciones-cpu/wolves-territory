import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Transacción inválida." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://sandbox.wompi.co/v1/transactions/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const rawResponse = await response.text();

    let wompiResponse;

    try {
      wompiResponse = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Wompi returned a non-JSON response:",
        rawResponse.slice(0, 500)
      );

      return NextResponse.json(
        {
          error:
            "Wompi devolvió una respuesta inesperada.",
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(
        "Wompi verification error:",
        wompiResponse
      );

      return NextResponse.json(
        {
          error:
            wompiResponse?.error?.reason ??
            "No fue posible verificar la transacción con Wompi.",
        },
        { status: response.status }
      );
    }

    const transaction = wompiResponse.data;

    if (!transaction) {
      return NextResponse.json(
        {
          error:
            "Wompi no devolvió información de la transacción.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amountInCents: transaction.amount_in_cents,
      currency: transaction.currency,
      paymentMethodType:
        transaction.payment_method_type,
    });
  } catch (error) {
    console.error(
      "Transaction verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno verificando la transacción.",
      },
      { status: 500 }
    );
  }
}