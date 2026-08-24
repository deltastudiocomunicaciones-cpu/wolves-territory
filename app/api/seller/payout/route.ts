import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

type PayoutPayload = {
  accessToken?: string;

  payoutMethod?: string;

  accountHolderName?: string;

  accountHolderDocumentType?: string;
  accountHolderDocumentNumber?: string;

  bankName?: string;

  accountType?: string;

  accountNumber?: string;
  confirmAccountNumber?: string;
};

function clean(
  value?: string
) {
  return value?.trim() ?? "";
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as PayoutPayload;

    const accessToken =
      clean(body.accessToken);

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Sesión Seller inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const payoutMethod =
      clean(body.payoutMethod) ||
      "BANK_TRANSFER";

    const accountHolderName =
      clean(
        body.accountHolderName
      );

    const accountHolderDocumentType =
      clean(
        body.accountHolderDocumentType
      ) || "CC";

    const accountHolderDocumentNumber =
      clean(
        body.accountHolderDocumentNumber
      ).replace(/\D/g, "");

    const bankName =
      clean(body.bankName);

    const accountType =
      clean(body.accountType);

    const accountNumber =
      clean(
        body.accountNumber
      ).replace(/\s+/g, "");

    const confirmAccountNumber =
      clean(
        body.confirmAccountNumber
      ).replace(/\s+/g, "");

    /* =====================================================
     * VALIDACIÓN
     * ===================================================== */

    if (
      !accountHolderName ||
      !accountHolderDocumentNumber ||
      !bankName ||
      !accountType ||
      !accountNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Completa todos los datos bancarios.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      accountNumber !==
      confirmAccountNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Los números de cuenta no coinciden.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "SAVINGS",
        "CHECKING",
        "WALLET",
      ].includes(accountType)
    ) {
      return NextResponse.json(
        {
          error:
            "Tipo de cuenta inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
     * SUPABASE ADMIN
     * ===================================================== */

    const supabase =
      getSupabaseAdmin();

    /*
     * Validamos el access token
     * contra Supabase Auth.
     */
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
            "Sesión Seller inválida.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
     * BUSCAR PARTNER
     * ===================================================== */

    const {
      data: partner,
      error: partnerError,
    } = await supabase
      .from("partners")
      .select(
        `
        id,
        code,
        name,
        type,
        active
        `
      )
      .eq(
        "auth_user_id",
        userData.user.id
      )
      .single();

    if (
      partnerError ||
      !partner ||
      partner.type !==
        "SELLER" ||
      !partner.active
    ) {
      return NextResponse.json(
        {
          error:
            "Seller no autorizado.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
     * DESACTIVAR CUENTA ANTERIOR
     *
     * V1: un único destino activo.
     * ===================================================== */

    const {
      error: deactivateError,
    } = await supabase
      .from(
        "partner_payout_accounts"
      )
      .update({
        active: false,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "partner_id",
        partner.id
      )
      .eq(
        "active",
        true
      );

    if (deactivateError) {
      throw new Error(
        "No fue posible actualizar la información bancaria."
      );
    }

    /* =====================================================
     * CREAR CUENTA
     * ===================================================== */

    const accountLast4 =
      accountNumber.slice(-4);

    const {
      data: payoutAccount,
      error: insertError,
    } = await supabase
      .from(
        "partner_payout_accounts"
      )
      .insert({
        partner_id:
          partner.id,

        payout_method:
          payoutMethod,

        account_holder_name:
          accountHolderName,

        account_holder_document_type:
          accountHolderDocumentType,

        account_holder_document_number:
          accountHolderDocumentNumber,

        bank_name:
          bankName,

        account_type:
          accountType,

        account_number:
          accountNumber,

        account_last4:
          accountLast4,

        verified:
          false,

        verified_at:
          null,

        active:
          true,
      })
      .select(
        `
        id,
        payout_method,
        bank_name,
        account_type,
        account_last4,
        verified,
        active,
        created_at
        `
      )
      .single();

    if (
      insertError ||
      !payoutAccount
    ) {
      console.error(
        "PAYOUT ACCOUNT INSERT ERROR:",
        insertError
      );

      throw new Error(
        "No fue posible guardar la cuenta bancaria."
      );
    }

    return NextResponse.json(
      {
        success: true,

        payoutAccount,

        message:
          "Información bancaria registrada. Pendiente de verificación.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Seller payout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible registrar la información bancaria.",
      },
      {
        status: 500,
      }
    );
  }
}