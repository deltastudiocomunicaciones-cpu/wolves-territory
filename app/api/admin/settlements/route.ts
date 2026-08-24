import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

export async function GET(
  request: Request
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authHeader?.startsWith("Bearer ")
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
            "No tienes permisos para consultar liquidaciones.",
        },
        {
          status: 403,
        }
      );
    }

    /* =========================================
     * SETTLEMENTS READY
     * ========================================= */

    const {
      data: settlements,
      error: settlementsError,
    } = await supabase
      .from("seller_settlements")
      .select(`
        id,
        reference,
        partner_id,
        period_start,
        period_end,
        sales_base_amount,
        commission_amount,
        commission_count,
        status,
        created_at
      `)
      .eq(
        "status",
        "READY"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (settlementsError) {
      console.error(
        "ADMIN SETTLEMENTS ERROR:",
        settlementsError
      );

      throw new Error(
        "No fue posible cargar las liquidaciones."
      );
    }

    const partnerIds = [
      ...new Set(
        (settlements ?? []).map(
          (settlement) =>
            settlement.partner_id
        )
      ),
    ];

    /* =========================================
     * PARTNERS
     * ========================================= */

    let partners: {
      id: string;
      code: string;
      name: string;
      email: string | null;
    }[] = [];

    if (partnerIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("partners")
        .select(`
          id,
          code,
          name,
          email
        `)
        .in(
          "id",
          partnerIds
        );

      if (error) {
        throw new Error(
          "No fue posible cargar los Sellers."
        );
      }

      partners =
        data ?? [];
    }

    /* =========================================
     * VERIFIED PAYOUT ACCOUNTS
     * ========================================= */

    let payoutAccounts: {
      id: string;
      partner_id: string;
      payout_method: string;
      bank_name: string | null;
      account_type: string | null;
      account_last4: string;
      verified: boolean;
      active: boolean;
    }[] = [];

    if (partnerIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "partner_payout_accounts"
        )
        .select(`
          id,
          partner_id,
          payout_method,
          bank_name,
          account_type,
          account_last4,
          verified,
          active
        `)
        .in(
          "partner_id",
          partnerIds
        )
        .eq(
          "active",
          true
        )
        .eq(
          "verified",
          true
        );

      if (error) {
        throw new Error(
          "No fue posible validar las cuentas de pago."
        );
      }

      payoutAccounts =
        data ?? [];
    }

    const partnerMap =
      new Map(
        partners.map(
          (partner) => [
            partner.id,
            partner,
          ]
        )
      );

    const payoutMap =
      new Map(
        payoutAccounts.map(
          (account) => [
            account.partner_id,
            account,
          ]
        )
      );

    const result =
      (settlements ?? []).map(
        (settlement) => ({
          id:
            settlement.id,

          reference:
            settlement.reference,

          periodStart:
            settlement.period_start,

          periodEnd:
            settlement.period_end,

          salesBaseAmount:
            settlement.sales_base_amount,

          commissionAmount:
            settlement.commission_amount,

          commissionCount:
            settlement.commission_count,

          status:
            settlement.status,

          createdAt:
            settlement.created_at,

          partner:
            partnerMap.get(
              settlement.partner_id
            ) ?? null,

          payoutAccount:
            payoutMap.get(
              settlement.partner_id
            ) ?? null,

          payoutReady:
            payoutMap.has(
              settlement.partner_id
            ),
        })
      );

    return NextResponse.json({
      success: true,
      count:
        result.length,
      settlements:
        result,
    });
  } catch (error) {
    console.error(
      "ADMIN SETTLEMENT LIST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible cargar las liquidaciones.",
      },
      {
        status: 500,
      }
    );
  }
}