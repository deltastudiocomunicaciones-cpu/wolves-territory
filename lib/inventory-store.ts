import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function processOrderInventory(
  reference: string
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc(
    "process_order_inventory",
    {
      p_reference: reference,
    }
  );

  if (error) {
    console.error("INVENTORY PROCESS ERROR:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      reference,
    });

    throw new Error(
      "No fue posible actualizar el inventario."
    );
  }

  console.log("INVENTORY PROCESSED:", {
    reference,
    result: data,
  });

  return data;
}