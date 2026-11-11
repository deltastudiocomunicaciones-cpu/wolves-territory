import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { products } from "@/data/products";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawItem = { slug?: unknown; size?: unknown; quantity?: unknown };
type ReservationPayload = {
  items?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  city?: unknown;
  consent?: unknown;
  company?: unknown;
};

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max + 1) : "";

type Selection = {
  product_slug: string;
  product_name: string;
  product_sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  price_reference_cop: number;
};

function validateSelection(input: unknown): Selection[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 12) return null;
  const selections: Selection[] = [];
  const seen = new Set<string>();
  let totalQuantity = 0;

  for (const unknownItem of input) {
    if (!unknownItem || typeof unknownItem !== "object" || Array.isArray(unknownItem)) return null;
    const item = unknownItem as RawItem;
    const slug = clean(item.slug, 120);
    const size = clean(item.size, 8).toUpperCase();
    const quantity = Number(item.quantity);
    if (!slug || !Number.isInteger(quantity) || quantity < 1 || quantity > 3) return null;

    const product = products.find((candidate) =>
      candidate.slug === slug ||
      candidate.variants?.some((variant) => variant.slug === slug)
    );
    if (!product) return null;
    const variant = product.variants?.find((v) => v.slug === slug) ?? product.variants?.[0];
    const skuBase = variant?.skuBase ?? product.sku;
    const requiresSize = !["Cap", "Accessory"].includes(product.category);
    if (!skuBase || (requiresSize && !["M", "L", "XL", "XXL"].includes(size)) || (!requiresSize && size)) return null;
    const sku = requiresSize ? `${skuBase}-${size}` : skuBase;
    if (seen.has(sku)) return null;
    seen.add(sku);
    totalQuantity += quantity;
    if (totalQuantity > 20) return null;

    selections.push({
      product_slug: slug,
      product_name: product.name,
      product_sku: sku,
      color: variant?.color ?? null,
      size: requiresSize ? size : null,
      quantity,
      price_reference_cop: product.price,
    });
  }
  return selections;
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 12000) {
      return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
    }
    const body = (await request.json()) as ReservationPayload;
    if (clean(body.company, 120)) {
      return NextResponse.json({ error: "No pudimos registrar la solicitud." }, { status: 400 });
    }

    const name = clean(body.name, 100).replace(/\s+/g, " ");
    const email = clean(body.email, 180).toLowerCase();
    const phone = clean(body.phone, 30);
    const city = clean(body.city, 90);
    const selection = validateSelection(body.items);

    if (
      name.length < 3 || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180 ||
      !/^[+\d()\s.-]{7,25}$/.test(phone) ||
      city.length < 2 || city.length > 90 ||
      body.consent !== true || !selection
    ) {
      return NextResponse.json({
        error: "Revisa tus datos y agrega al menos una prenda válida antes de enviar."
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const windowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    // Throttle repeated contact submissions; public clients cannot query the table.
    const { data: repeated, error: duplicateError } = await supabase
      .from("commercial_reservation_requests")
      .select("id")
      .eq("customer_email", email)
      .gte("created_at", windowStart)
      .limit(1);
    if (duplicateError) throw duplicateError;
    if ((repeated?.length ?? 0) > 0) {
      return NextResponse.json({
        error: "Ya recibimos una solicitud reciente con este correo. Contacta al equipo por WhatsApp si deseas ajustar tu selección."
      }, { status: 429 });
    }

    const first = selection[0];
    const reference = `WT-RSV-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const { error } = await supabase.from("commercial_reservation_requests").insert({
      reference,
      // Legacy summary fields retained for operational compatibility.
      product_slug: first.product_slug,
      product_name: first.product_name,
      product_sku: first.product_sku,
      color: first.color,
      size: first.size,
      quantity: first.quantity,
      selection_items: selection,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      city,
      consent_contact: true,
      status: "REQUESTED",
      source: "WEB_PRELAUNCH",
    });
    if (error) throw error;

    return NextResponse.json({
      reference,
      itemCount: selection.length,
      message: "Solicitud de selección recibida. El formulario no procesó pagos ni apartó existencias."
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Reservation request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({
      error: "No fue posible registrar la solicitud. Inténtalo nuevamente o contáctanos."
    }, { status: 500 });
  }
}
