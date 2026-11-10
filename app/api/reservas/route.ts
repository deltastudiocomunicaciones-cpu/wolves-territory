import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { products } from "@/data/products";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReservationPayload = {
  productSlug?: unknown;
  size?: unknown;
  quantity?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  city?: unknown;
  consent?: unknown;
  company?: unknown; // honeypot: must remain empty
};

const clean = (value: unknown, length: number) =>
  typeof value === "string" ? value.trim().slice(0, length + 1) : "";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 12000) {
      return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
    }
    const body = (await request.json()) as ReservationPayload;

    if (clean(body.company, 120)) {
      return NextResponse.json({ error: "No pudimos registrar la solicitud." }, { status: 400 });
    }

    const productSlug = clean(body.productSlug, 120);
    const name = clean(body.name, 100).replace(/\s+/g, " ");
    const email = clean(body.email, 180).toLowerCase();
    const phone = clean(body.phone, 30);
    const city = clean(body.city, 90);
    const size = clean(body.size, 8).toUpperCase();
    const quantity = Number(body.quantity);

    if (
      !productSlug || !name || name.length < 3 || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180 ||
      !/^[+\d()\s.-]{7,25}$/.test(phone) ||
      city.length < 2 || city.length > 90 ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 3 ||
      body.consent !== true
    ) {
      return NextResponse.json({ error: "Verifica tus datos y acepta el aviso de contacto." }, { status: 400 });
    }

    const product = products.find((item) =>
      item.slug === productSlug ||
      item.variants?.some((variant) => variant.slug === productSlug)
    );
    if (!product) {
      return NextResponse.json({ error: "Selecciona una referencia válida del catálogo." }, { status: 400 });
    }

    const variant = product.variants?.find((item) => item.slug === productSlug) ?? product.variants?.[0];
    const skuBase = variant?.skuBase ?? product.sku;
    const requiresSize = product.category !== "Cap" && product.category !== "Accessory";

    if (!skuBase || (requiresSize && !["M", "L", "XL", "XXL"].includes(size)) || (!requiresSize && !!size)) {
      return NextResponse.json({ error: "Elige una referencia y talla válidas." }, { status: 400 });
    }

    const sku = requiresSize ? `${skuBase}-${size}` : skuBase;
    const supabase = getSupabaseAdmin();
    const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Simple server-side duplicate throttle; never expose reservations to the public client.
    const { data: repeated, error: duplicateError } = await supabase
      .from("commercial_reservation_requests")
      .select("id")
      .eq("customer_email", email)
      .eq("product_sku", sku)
      .gte("created_at", windowStart)
      .limit(1);
    if (duplicateError) throw duplicateError;
    if ((repeated?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Ya registramos recientemente una solicitud para esta referencia y correo. Puedes escribirnos si necesitas modificarla." },
        { status: 429 }
      );
    }

    const reference = `WT-RSV-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const { error } = await supabase.from("commercial_reservation_requests").insert({
      reference,
      product_slug: productSlug,
      product_name: product.name,
      product_sku: sku,
      color: variant?.color ?? null,
      size: requiresSize ? size : null,
      quantity,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      city,
      consent_contact: true,
      status: "REQUESTED",
      source: "WEB_PRELAUNCH",
    });
    if (error) throw error;

    return NextResponse.json(
      { reference, message: "Solicitud registrada. Este formulario no procesó pagos ni apartó inventario; el equipo comercial confirmará las condiciones de separación." },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Reservation request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "No fue posible registrar la solicitud. Inténtalo más tarde o contáctanos." },
      { status: 500 }
    );
  }
}
