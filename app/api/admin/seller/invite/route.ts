import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

type InvitePayload = {
  partnerId?: string;
};

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
     * 1. PROTECCIÓN ADMIN TEMPORAL
     * ===================================================== */

    const adminSecret =
      process.env.ADMIN_SELLER_INVITE_SECRET;

    if (!adminSecret) {
      throw new Error(
        "ADMIN_SELLER_INVITE_SECRET is missing."
      );
    }

    const receivedSecret =
      request.headers.get(
        "x-admin-secret"
      );

    if (
      !receivedSecret ||
      receivedSecret !== adminSecret
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
     * 2. PAYLOAD
     * ===================================================== */

    const body =
      (await request.json()) as
        InvitePayload;

    const partnerId =
      body.partnerId?.trim();

    if (!partnerId) {
      return NextResponse.json(
        {
          error:
            "partnerId es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /* =====================================================
     * 3. BUSCAR SELLER
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
        email,
        type,
        active,
        auth_user_id
        `
      )
      .eq("id", partnerId)
      .single();

    if (
      partnerError ||
      !partner
    ) {
      return NextResponse.json(
        {
          error:
            "Seller no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      partner.type !== "SELLER"
    ) {
      return NextResponse.json(
        {
          error:
            "El partner no es un Seller.",
        },
        {
          status: 400,
        }
      );
    }

    if (!partner.active) {
      return NextResponse.json(
        {
          error:
            "El Seller está inactivo.",
        },
        {
          status: 400,
        }
      );
    }

    if (!partner.email) {
      return NextResponse.json(
        {
          error:
            "El Seller no tiene email registrado.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * IDEMPOTENCIA
     *
     * Si ya está vinculado a Auth,
     * no creamos otro usuario.
     */
    if (partner.auth_user_id) {
      return NextResponse.json({
        invited: false,
        alreadyLinked: true,

        seller: {
          id: partner.id,
          code: partner.code,
          name: partner.name,
          authUserId:
            partner.auth_user_id,
        },
      });
    }

    /* =====================================================
     * 4. REDIRECT
     * ===================================================== */

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const redirectTo =
      `${siteUrl}/seller/activate`;

    /* =====================================================
     * 5. INVITAR EN SUPABASE AUTH
     * ===================================================== */

    const {
      data: inviteData,
      error: inviteError,
    } =
      await supabase.auth.admin
        .inviteUserByEmail(
          partner.email.trim().toLowerCase(),
          {
            redirectTo,

            data: {
              partner_id:
                partner.id,

              seller_code:
                partner.code,

              full_name:
                partner.name,
            },
          }
        );

    if (
      inviteError ||
      !inviteData.user
    ) {
      console.error(
        "SELLER AUTH INVITE ERROR:",
        inviteError
      );

      throw new Error(
        inviteError?.message ??
          "No fue posible enviar la invitación."
      );
    }

    /* =====================================================
     * 6. VINCULAR AUTH USER ↔ PARTNER
     * ===================================================== */

    const {
      error: updateError,
    } = await supabase
      .from("partners")
      .update({
        auth_user_id:
          inviteData.user.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", partner.id);

    if (updateError) {
      console.error(
        "SELLER AUTH LINK ERROR:",
        updateError
      );

      throw new Error(
        "Se creó el usuario Auth pero no fue posible vincularlo al Seller."
      );
    }

    /* =====================================================
     * 7. RESPONSE
     * ===================================================== */

    console.log(
      "SELLER INVITED:",
      {
        partnerId:
          partner.id,

        sellerCode:
          partner.code,

        authUserId:
          inviteData.user.id,
      }
    );

    return NextResponse.json({
      invited: true,

      seller: {
        id:
          partner.id,

        code:
          partner.code,

        name:
          partner.name,

        authUserId:
          inviteData.user.id,
      },
    });
  } catch (error) {
    console.error(
      "Seller invite error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible invitar al Seller.",
      },
      {
        status: 500,
      }
    );
  }
}