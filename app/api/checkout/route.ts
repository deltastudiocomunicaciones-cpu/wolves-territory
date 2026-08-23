import { NextResponse } from "next/server";
import crypto from "crypto";

import { products } from "@/data/products";
import { createOrder } from "@/lib/order-store";

type CheckoutItem = {
  productId: string | number;
  quantity: number;
  size?: string | null;
};

type CheckoutPayload = {
  items: CheckoutItem[];

  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    document: string;
    address: string;
    addressExtra?: string;
    city: string;
    department: string;
  };

  partnerCode?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutPayload;

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "El carrito está vacío." },
        { status: 400 }
      );
    }

    if (
      !body.customer?.firstName ||
      !body.customer?.lastName ||
      !body.customer?.email ||
      !body.customer?.phone ||
      !body.customer?.document ||
      !body.customer?.address ||
      !body.customer?.city ||
      !body.customer?.department
    ) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    let totalCOP = 0;

    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: "Cantidad inválida." },
          { status: 400 }
        );
      }

      const product = products.find(
        (candidate) =>
          String(candidate.id) === String(item.productId)
      );

      if (!product) {
        return NextResponse.json(
          {
            error: `Producto inválido: ${item.productId}`,
          },
          { status: 400 }
        );
      }

      totalCOP += product.price * item.quantity;
    }

    const reference = `WT-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const orderItems = body.items.map((item) => {
      const product = products.find(
        (candidate) =>
          String(candidate.id) === String(item.productId)
      );

      if (!product) {
        throw new Error(
          `Producto inválido: ${item.productId}`
        );
      }

      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        size: item.size ?? null,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      };
    });

    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret =
      process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey || !integritySecret) {
      throw new Error(
        "La pasarela de pago no está configurada."
      );
    }

    const now = new Date().toISOString();

  const normalizedPartnerCode =
  body.partnerCode?.trim().toUpperCase() || null;

let partner:
  | {
      id: string;
      code: string;
      commission_rate: number;
    }
  | null = null;

if (normalizedPartnerCode) {
  const { getSupabaseAdmin } = await import(
    "@/lib/supabase-server"
  );

  const supabase = getSupabaseAdmin();

  console.log("SUPABASE PARTNER CHECK:", {
  urlConfigured: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  serviceRoleConfigured: Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ),
});

  const { data, error } = await supabase
    .from("partners")
    .select(
      "id, code, commission_rate"
    )
    .eq("code", normalizedPartnerCode)
    .eq("active", true)
    .maybeSingle();

  if (error) {
  console.error("PARTNER LOOKUP ERROR:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(
    "No fue posible validar el vendedor."
  );
}

  if (data) {
    partner = data;
  }
}  

const commissionRate =
  partner?.commission_rate ?? 0;

const commissionAmount = Math.round(
  totalCOP * (commissionRate / 100)
);

   await createOrder({
  reference,
  status: "CREATED",
  customer: body.customer,
  items: orderItems,
  subtotal: totalCOP,
  shipping: 0,
  discount: 0,
  total: totalCOP,
  currency: "COP",

  partnerId: partner?.id ?? null,
  partnerCode: partner?.code ?? null,
  commissionRate,
  commissionAmount,

  createdAt: now,
  updatedAt: now,
});

    const currency = "COP";
    const amountInCents = totalCOP * 100;

    const signatureString =
      reference +
      amountInCents +
      currency +
      integritySecret;

    const integritySignature = crypto
      .createHash("sha256")
      .update(signatureString)
      .digest("hex");

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    return NextResponse.json({
      publicKey,
      currency,
      amountInCents,
      reference,
      integritySignature,
      redirectUrl: `${siteUrl}/payment/result`,
      customer: {
        email: body.customer.email,
        fullName: `${body.customer.firstName} ${body.customer.lastName}`,
        phone: body.customer.phone,
        legalId: body.customer.document,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible preparar el pago.",
      },
      { status: 500 }
    );
  }
}