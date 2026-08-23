import { Order } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/*
 * CREAR ORDEN
 */
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

      // PARTNER / RED COMERCIAL
      partner_id: order.partnerId ?? null,
      partner_code: order.partnerCode ?? null,
      commission_rate:
        order.commissionRate ?? 0,
      commission_amount:
        order.commissionAmount ?? 0,

      // CUSTOMER
      first_name:
        order.customer.firstName,
      last_name:
        order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone,
      document:
        order.customer.document,

      // DELIVERY
      address:
        order.customer.address,
      address_extra:
        order.customer.addressExtra ?? null,
      city: order.customer.city,
      department:
        order.customer.department,

      // TOTALS
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      currency: order.currency,

      // WOMPI
      wompi_transaction_id:
        order.wompiTransactionId ?? null,

      created_at: order.createdAt,
      updated_at: order.updatedAt,
    })
    .select("id")
    .single();

  if (orderError || !createdOrder) {
    console.error(
      "SUPABASE ORDER ERROR:",
      {
        message: orderError?.message,
        details: orderError?.details,
        hint: orderError?.hint,
        code: orderError?.code,
      }
    );

    throw new Error(
      "No fue posible guardar el pedido."
    );
  }

  /*
   * CREAR ITEMS DE LA ORDEN
   */
  const items = order.items.map(
    (item) => ({
      order_id: createdOrder.id,

      product_id:
        String(item.productId),

      product_name: item.name,

      quantity: item.quantity,
      size: item.size ?? null,

      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    })
  );

  const { error: itemsError } =
    await supabase
      .from("order_items")
      .insert(items);

  if (itemsError) {
    console.error(
      "SUPABASE ORDER ITEMS ERROR:",
      {
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
        code: itemsError.code,
      }
    );

    /*
     * Si falla la creación de items,
     * eliminamos la orden incompleta.
     */
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

/*
 * ACTUALIZAR ESTADO DE ORDEN
 */
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

        updated_at:
          new Date().toISOString(),
      })
      .eq("reference", reference)
      .select(
        `
        id,
        reference,
        status,
        wompi_transaction_id
        `
      )
      .single();

  if (error) {
    console.error(
      "SUPABASE UPDATE ORDER ERROR:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      "No fue posible actualizar el pedido."
    );
  }

  return data;
}

/*
 * CREAR / RECONOCER COMISIÓN
 *
 * Solo debe llamarse cuando
 * Wompi confirme APPROVED.
 */
export async function createEarnedCommission(
  reference: string
) {
  const supabase = getSupabaseAdmin();

  /*
   * Buscamos la orden
   */
  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select(
      `
      id,
      reference,
      partner_id,
      partner_code,
      commission_rate,
      commission_amount,
      total
      `
    )
    .eq("reference", reference)
    .single();

  if (orderError || !order) {
    console.error(
      "COMMISSION ORDER LOOKUP ERROR:",
      orderError
    );

    throw new Error(
      "No fue posible encontrar la orden para liquidar la comisión."
    );
  }

  /*
   * Si la compra no vino de
   * un vendedor/store, no hacemos nada.
   */
  if (
    !order.partner_id ||
    !order.partner_code ||
    Number(order.commission_rate) <= 0 ||
    Number(order.commission_amount) <= 0
  ) {
    console.log(
      "ORDER WITHOUT COMMISSION:",
      reference
    );

    return null;
  }

  const now =
    new Date().toISOString();

  /*
   * UPSERT evita duplicados.
   *
   * Si Wompi manda APPROVED
   * varias veces para la misma orden,
   * seguimos teniendo una sola comisión.
   */
  const {
    data: commission,
    error: commissionError,
  } = await supabase
    .from("commissions")
    .upsert(
      {
        partner_id:
          order.partner_id,

        order_id:
          order.id,

        order_reference:
          order.reference,

        base_amount:
          order.total,

        commission_rate:
          order.commission_rate,

        commission_amount:
          order.commission_amount,

        status: "EARNED",

        earned_at: now,
      },
      {
        onConflict: "order_id",
      }
    )
    .select()
    .single();

  if (commissionError) {
    console.error(
      "COMMISSION CREATE ERROR:",
      {
        message:
          commissionError.message,

        details:
          commissionError.details,

        hint:
          commissionError.hint,

        code:
          commissionError.code,
      }
    );

    throw new Error(
      "No fue posible registrar la comisión."
    );
  }

  console.log(
    "COMMISSION EARNED:",
    {
      reference,

      partner:
        order.partner_code,

      amount:
        order.commission_amount,
    }
  );

  return commission;
}