import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

export async function GET(
  request: Request
) {
  try {
    /* ============================================
     * 1. ACCESS TOKEN
     * ============================================ */

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

    const supabase =
      getSupabaseAdmin();

    /* ============================================
     * 2. VALIDAR AUTH
     * ============================================ */

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

    /* ============================================
     * 3. VALIDAR ADMIN
     * ============================================ */

    const {
      data: admin,
      error: adminError,
    } = await supabase
      .from("admin_users")
      .select(
        `
        id,
        full_name,
        role,
        active
        `
      )
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
            "No tienes permisos para consultar cuentas.",
        },
        {
          status: 403,
        }
      );
    }

    /* ============================================
     * 4. CUENTAS PENDIENTES
     * ============================================ */

    const {
      data: accounts,
      error: accountsError,
    } = await supabase
      .from(
        "partner_payout_accounts"
      )
      .select(
        `
        id,
        partner_id,

        payout_method,

        account_holder_name,
        account_holder_document_type,
        account_holder_document_number,

        bank_name,
        account_type,
        account_last4,

        verified,
        verified_at,
        active,

        created_at
        `
      )
      .eq(
        "active",
        true
      )
      .eq(
        "verified",
        false
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (accountsError) {
      console.error(
        "ADMIN PAYOUT ACCOUNTS ERROR:",
        accountsError
      );

      throw new Error(
        "No fue posible cargar las cuentas pendientes."
      );
    }

    /* ============================================
     * 5. PARTNERS
     * ============================================ */

    const partnerIds = [
      ...new Set(
        (accounts ?? []).map(
          (account) =>
            account.partner_id
        )
      ),
    ];

    let partners: {
      id: string;
      code: string;
      name: string;
      email: string | null;
    }[] = [];

    if (
      partnerIds.length > 0
    ) {
      const {
        data: partnerData,
        error: partnersError,
      } = await supabase
        .from("partners")
        .select(
          `
          id,
          code,
          name,
          email
          `
        )
        .in(
          "id",
          partnerIds
        );

      if (partnersError) {
        throw new Error(
          "No fue posible cargar los Sellers."
        );
      }

      partners =
        partnerData ?? [];
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

    /* ============================================
     * 6. RESPUESTA SEGURA
     *
     * No devolvemos account_number completo.
     * ============================================ */

    const result =
      (accounts ?? []).map(
        (account) => ({
          id:
            account.id,

          partnerId:
            account.partner_id,

          payoutMethod:
            account.payout_method,

          accountHolderName:
            account.account_holder_name,

          documentType:
            account.account_holder_document_type,

          documentNumber:
            account.account_holder_document_number,

          bankName:
            account.bank_name,

          accountType:
            account.account_type,

          accountLast4:
            account.account_last4,

          verified:
            account.verified,

          createdAt:
            account.created_at,

          partner:
            partnerMap.get(
              account.partner_id
            ) ?? null,
        })
      );

    return NextResponse.json({
      success: true,

      count:
        result.length,

      accounts:
        result,
    });
  } catch (error) {
    console.error(
      "ADMIN PAYOUT LIST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible cargar las cuentas pendientes.",
      },
      {
        status: 500,
      }
    );
  }
}