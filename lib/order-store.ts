import { Order } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function createOrder(
  order: Order
): Promise<Order> {
  const supabase = getSupabaseAdmin();

  const {
    data: createdOrder,
    error: orderError,
  } = await supabase
    .from("orders")
    .insert({
      reference: order.reference,
      status: order.status,

      first_name: order.customer.firstName,
      last_name: order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone,
      document: order.customer.document,

      address: order.customer.address,
      address_extra:
        order.customer.addressExtra ?? null,
      city: order.customer.city,
      department: order.customer.department,

      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,

      currency: order.currency,

      wompi_transaction_id:
        order.wompiTransactionId ?? null,

      created_at: order.createdAt,
      updated_at: order.updatedAt,
    })
    .select("id")
    .single();

  if (orderError || !createdOrder) {
    console.error("SUPABASE ORDER ERROR:", {
      message: orderError?.message,
      details: orderError?.details,
      hint: orderError?.hint,
      code: orderError?.code,
    });

    throw new Error(
      "No fue posible guardar el pedido."
    );
  }

  const items = order.items.map((item) => ({
    order_id: createdOrder.id,

    product_id: String(item.productId),
    product_name: item.name,

    quantity: item.quantity,
    size: item.size ?? null,

    unit_price: item.unitPrice,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } =
    await supabase
      .from("order_items")
      .insert(items);

  if (itemsError) {
    console.error("SUPABASE ORDER ITEMS ERROR:", {
      message: itemsError.message,
      details: itemsError.details,
      hint: itemsError.hint,
      code: itemsError.code,
    });

    await supabase
      .from("orders")
      .delete()
      .eq("id", createdOrder.id);

    throw new Error(
      "No fue posible guardar los productos del pedido."
    );
  }

  console.log(
    "ORDER PERSISTED:",
    order.reference
  );

  return order;
}

export async function updateOrderStatus(
  reference: string,
  status: Order["status"],
  wompiTransactionId?: string
) {
  const supabase = getSupabaseAdmin();

  const { data, error } =
    await supabase
      .from("orders")
      .update({
        status,
        wompi_transaction_id:
          wompiTransactionId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference)
      .select(
        "id, reference, status, wompi_transaction_id"
      )
      .single();

  if (error) {
    console.error("SUPABASE UPDATE ORDER ERROR:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw new Error(
      "No fue posible actualizar el pedido."
    );
  }

  return data;
}