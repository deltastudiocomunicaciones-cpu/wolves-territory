import { NextResponse } from "next/server";
import crypto from "crypto";

import { updateOrderStatus } from "@/lib/order-store";

type WompiEvent = {
  event: string;

  data: Record<string, unknown>;

  environment: "test" | "prod";

  signature: {
    properties: string[];
    checksum: string;
  };

  timestamp: number;
  sent_at?: string;
};

function getNestedValue(
  source: Record<string, unknown>,
  path: string
): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, key) => {
      if (
        current &&
        typeof current === "object" &&
        key in current
      ) {
        return (
          current as Record<string, unknown>
        )[key];
      }

      return undefined;
    }, source);
}

export async function POST(request: Request) {
  try {
    /*
     * 1. SECRETO DE EVENTOS
     */
    const eventsSecret =
      process.env.WOMPI_EVENTS_SECRET;

    if (!eventsSecret) {
      console.error(
        "WOMPI_EVENTS_SECRET is missing"
      );

      return NextResponse.json(
        {
          error:
            "Webhook no configurado correctamente.",
        },
        { status: 500 }
      );
    }

    /*
     * 2. LEER EVENTO WOMPI
     */
    const body =
      (await request.json()) as WompiEvent;

    if (
      !body?.event ||
      !body?.data ||
      !body?.signature?.properties ||
      !body?.signature?.checksum ||
      !body?.timestamp
    ) {
      return NextResponse.json(
        {
          error: "Evento Wompi inválido.",
        },
        { status: 400 }
      );
    }

    /*
     * 3. OBTENER LOS VALORES QUE WOMPI USÓ
     *    PARA CONSTRUIR LA FIRMA
     */
    const propertyValues =
      body.signature.properties.map(
        (property) => {
          const value = getNestedValue(
            body.data,
            property
          );

          if (
            value === undefined ||
            value === null
          ) {
            throw new Error(
              `Missing signed property: ${property}`
            );
          }

          return String(value);
        }
      );

    /*
     * 4. RECONSTRUIR CHECKSUM
     */
    const stringToSign =
      propertyValues.join("") +
      String(body.timestamp) +
      eventsSecret;

    const calculatedChecksum = crypto
      .createHash("sha256")
      .update(stringToSign)
      .digest("hex");

    /*
     * Wompi puede enviar el checksum
     * en header o en signature.checksum.
     */
    const receivedChecksum =
      request.headers.get(
        "x-event-checksum"
      ) ?? body.signature.checksum;

    /*
     * 5. COMPARACIÓN SEGURA
     */
    const expectedBuffer = Buffer.from(
      calculatedChecksum,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      receivedChecksum,
      "utf8"
    );

    if (
      expectedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      console.warn(
        "Rejected invalid Wompi webhook signature"
      );

      return NextResponse.json(
        {
          error: "Firma de evento inválida.",
        },
        { status: 401 }
      );
    }

    /*
     * 6. SOLO NOS INTERESA POR AHORA
     *    transaction.updated
     */
    if (
      body.event !==
      "transaction.updated"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    /*
     * 7. EXTRAER TRANSACCIÓN
     */
    const transaction =
      body.data.transaction as
        | {
            id?: string;
            status?: string;
            reference?: string;
            amount_in_cents?: number;
            currency?: string;
          }
        | undefined;

    if (
      !transaction?.id ||
      !transaction?.reference ||
      !transaction?.status
    ) {
      return NextResponse.json(
        {
          error:
            "Evento de transacción incompleto.",
        },
        { status: 400 }
      );
    }

    /*
     * 8. SOLO ACEPTAMOS ESTADOS
     *    QUE CONOCEMOS
     */
    const allowedStatuses = [
      "APPROVED",
      "PENDING",
      "DECLINED",
      "VOIDED",
    ] as const;

    type AllowedStatus =
      (typeof allowedStatuses)[number];

    if (
      allowedStatuses.includes(
        transaction.status as AllowedStatus
      )
    ) {
      await updateOrderStatus(
        transaction.reference,
        transaction.status as AllowedStatus,
        transaction.id
      );
    }

    console.log(
      "WOMPI VERIFIED WEBHOOK",
      {
        environment:
          body.environment,
        transactionId:
          transaction.id,
        reference:
          transaction.reference,
        status:
          transaction.status,
        amountInCents:
          transaction.amount_in_cents,
      }
    );

    /*
     * 9. RESPONDER RÁPIDO A WOMPI
     */
    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Wompi webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error procesando evento Wompi.",
      },
      { status: 500 }
    );
  }
}