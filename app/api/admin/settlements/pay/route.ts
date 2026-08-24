import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

type PayPayload = {
  reference?: string;
  paymentReference?: string;
};

export async function POST(
  request: Request
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authHeader?.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Sesión administrativa inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as
        PayPayload;

    const reference =
      body.reference?.trim();

    const paymentReference =
      body.paymentReference?.trim();

    if (
      !reference ||
      !paymentReference
    ) {
      return NextResponse.json(
        {
          error:
            "Referencia de liquidación y comprobante son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /* =========================================
     * AUTH
     * ========================================= */

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Sesión administrativa inválida.",
        },
        {
          status: 401,
        }
      );
    }

    /* =========================================
     * ADMIN
     * ========================================= */

    const {
      data: admin,
      error: adminError,
    } = await supabase
      .from("admin_users")
      .select(`
        id,
        full_name,
        role,
        active
      `)
      .eq(
        "auth_user_id",
        userData.user.id
      )
      .maybeSingle();

    if (
      adminError ||
      !admin ||
      !admin.active
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      ![
        "ADMIN",
        "SUPER_ADMIN",
        "FINANCE",
      ].includes(admin.role)
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permisos para registrar pagos.",
        },
        {
          status: 403,
        }
      );
    }

    /* =========================================
     * VALIDAR LIQUIDACIÓN
     * ========================================= */

    const {
      data: settlement,
      error: settlementError,
    } = await supabase
      .from("seller_settlements")
      .select(`
        id,
        reference,
        partner_id,
        commission_amount,
        status
      `)
      .eq(
        "reference",
        reference
      )
      .maybeSingle();

    if (
      settlementError ||
      !settlement
    ) {
      return NextResponse.json(
        {
          error:
            "Liquidación no encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      settlement.status !==
      "READY"
    ) {
      return NextResponse.json(
        {
          error:
            "La liquidación no está disponible para pago.",
        },
        {
          status: 409,
        }
      );
    }

    /* =========================================
     * CUENTA VERIFICADA
     * ========================================= */

    const {
      data: payoutAccount,
      error: payoutError,
    } = await supabase
      .from(
        "partner_payout_accounts"
      )
      .select(`
        id,
        payout_method,
        bank_name,
        account_last4,
        verified,
        active
      `)
      .eq(
        "partner_id",
        settlement.partner_id
      )
      .eq(
        "active",
        true
      )
      .eq(
        "verified",
        true
      )
      .maybeSingle();

    if (
      payoutError ||
      !payoutAccount
    ) {
      return NextResponse.json(
        {
          error:
            "El Seller no tiene una cuenta de pago activa y verificada.",
        },
        {
          status: 409,
        }
      );
    }

    /* =========================================
     * MOTOR DE PAGO
     * ========================================= */

    const {
      data: payment,
      error: paymentError,
    } = await supabase.rpc(
      "pay_seller_settlement",
      {
        p_reference:
          reference,

        p_payment_method:
          payoutAccount.payout_method,

        p_payment_reference:
          paymentReference,
      }
    );

    if (paymentError) {
      console.error(
        "SETTLEMENT PAY RPC ERROR:",
        paymentError
      );

      throw new Error(
        paymentError.message
      );
    }

    return NextResponse.json({
      success: true,

      payment,

      processedBy: {
        name:
          admin.full_name,

        role:
          admin.role,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN SETTLEMENT PAY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible registrar el pago.",
      },
      {
        status: 500,
      }
    );
  }
}