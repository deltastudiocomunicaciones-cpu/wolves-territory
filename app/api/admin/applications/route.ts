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

    /* =========================================
     * APPLICATIONS
     * ========================================= */

    const {
      data: applications,
      error: applicationsError,
    } = await supabase
      .from(
        "seller_applications"
      )
      .select(`
        id,
        full_name,
        document_type,
        document_number,
        email,
        phone,
        city,
        instagram,
        referral_source,
        motivation,
        status,
        privacy_accepted,
        terms_accepted,
        reviewed_at,
        review_notes,
        partner_id,
        created_at,
        updated_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (applicationsError) {
      console.error(
        "ADMIN APPLICATIONS ERROR:",
        applicationsError
      );

      throw new Error(
        "No fue posible cargar las solicitudes."
      );
    }

    /*
     * Traemos partners de solicitudes
     * ya aprobadas para saber código
     * y si Auth ya fue vinculado.
     */

    const partnerIds = [
      ...new Set(
        (applications ?? [])
          .map(
            (item) =>
              item.partner_id
          )
          .filter(Boolean)
      ),
    ] as string[];

    let partners: {
      id: string;
      code: string;
      name: string;
      auth_user_id: string | null;
      commission_rate: number;
    }[] = [];

    if (
      partnerIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("partners")
        .select(`
          id,
          code,
          name,
          auth_user_id,
          commission_rate
        `)
        .in(
          "id",
          partnerIds
        );

      if (error) {
        throw new Error(
          "No fue posible cargar los Sellers asociados."
        );
      }

      partners =
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

    return NextResponse.json({
      success: true,

      applications:
        (applications ?? []).map(
          (application) => ({
            ...application,

            partner:
              application.partner_id
                ? partnerMap.get(
                    application.partner_id
                  ) ?? null
                : null,
          })
        ),
    });
  } catch (error) {
    console.error(
      "ADMIN APPLICATION LIST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible cargar las solicitudes.",
      },
      {
        status: 500,
      }
    );
  }
}