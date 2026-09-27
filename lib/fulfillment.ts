import { getSupabaseAdmin } from "@/lib/supabase-server";

/* =========================================================
 * FULFILLMENT SERVER STORE
 *
 * Server-side boundary for privileged fulfillment operations.
 *
 * IMPORTANT:
 * - Uses service-role Supabase client.
 * - Must never be imported into client components.
 * - Inventory reservation is NOT physical stock deduction.
 * ========================================================= */

export async function reserveOrderForFulfillment(
  reference: string
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc(
    "reserve_order_for_fulfillment",
    {
      p_reference: reference,
    }
  );

  if (error) {
    console.error(
      "FULFILLMENT RESERVATION ERROR:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        reference,
      }
    );

    throw new Error(
      "No fue posible reservar el pedido para fulfillment."
    );
  }

  console.log(
    "FULFILLMENT RESERVED:",
    {
      reference,
      result: data,
    }
  );

  return data;
}