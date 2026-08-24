import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

type AdminAction =
  | "REVIEW"
  | "APPROVE"
  | "REJECT"
  | "INVITE";

type ActionPayload = {
  accessToken?: string;

  applicationId?: string;

  action?: AdminAction;

  commissionRate?: number;

  requestedCode?: string | null;

  notes?: string | null;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        ActionPayload;

    const accessToken =
      body.accessToken?.trim();

    const applicationId =
      body.applicationId?.trim();

    const action =
      body.action;

    if (
      !accessToken ||
      !applicationId ||
      !action
    ) {
      return NextResponse.json(
        {
          error:
            "Solicitud incompleta.",
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
        "OPERATIONS",
      ].includes(admin.role)
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permisos para gestionar solicitudes.",
        },
        {
          status: 403,
        }
      );
    }

    /* =========================================
     * APPLICATION
     * ========================================= */

    const {
      data: application,
      error: applicationError,
    } = await supabase
      .from(
        "seller_applications"
      )
      .select(`
        id,
        full_name,
        email,
        status,
        partner_id
      `)
      .eq(
        "id",
        applicationId
      )
      .maybeSingle();

    if (
      applicationError ||
      !application
    ) {
      return NextResponse.json(
        {
          error:
            "Solicitud no encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================================
     * UNDER REVIEW
     * ========================================= */

    if (
      action === "REVIEW"
    ) {
      if (
        application.status !==
        "APPLIED"
      ) {
        return NextResponse.json(
          {
            error:
              "La solicitud ya fue procesada.",
          },
          {
            status: 409,
          }
        );
      }

      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabase
        .from(
          "seller_applications"
        )
        .update({
          status:
            "UNDER_REVIEW",

          reviewed_by:
            admin.id,

          review_notes:
            body.notes?.trim() ||
            null,

          updated_at:
            now,
        })
        .eq(
          "id",
          application.id
        );

      if (error) {
        throw new Error(
          "No fue posible pasar la solicitud a revisión."
        );
      }

      return NextResponse.json({
        success: true,
        status:
          "UNDER_REVIEW",
      });
    }

    /* =========================================
     * REJECT
     * ========================================= */

    if (
      action === "REJECT"
    ) {
      if (
        ![
          "APPLIED",
          "UNDER_REVIEW",
        ].includes(
          application.status
        )
      ) {
        return NextResponse.json(
          {
            error:
              "La solicitud no puede ser rechazada en su estado actual.",
          },
          {
            status: 409,
          }
        );
      }

      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabase
        .from(
          "seller_applications"
        )
        .update({
          status:
            "REJECTED",

          reviewed_by:
            admin.id,

          reviewed_at:
            now,

          review_notes:
            body.notes?.trim() ||
            "Solicitud no aprobada.",

          updated_at:
            now,
        })
        .eq(
          "id",
          application.id
        );

      if (error) {
        throw new Error(
          "No fue posible rechazar la solicitud."
        );
      }

      return NextResponse.json({
        success: true,
        status:
          "REJECTED",
      });
    }

    /* =========================================
     * APPROVE
     * ========================================= */

    if (
      action === "APPROVE"
    ) {
      const commissionRate =
        Number(
          body.commissionRate ??
            10
        );

      if (
        !Number.isFinite(
          commissionRate
        ) ||
        commissionRate < 0 ||
        commissionRate > 100
      ) {
        return NextResponse.json(
          {
            error:
              "Porcentaje de comisión inválido.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Reutilizamos el motor
       * transaccional ya probado.
       */

      const {
        data: approval,
        error: approvalError,
      } = await supabase.rpc(
        "approve_seller_application",
        {
          p_application_id:
            application.id,

          p_commission_rate:
            commissionRate,

          p_requested_code:
            body.requestedCode
              ?.trim() ||
            null,
        }
      );

      if (approvalError) {
        console.error(
          "SELLER APPROVAL ERROR:",
          approvalError
        );

        throw new Error(
          approvalError.message
        );
      }

      /*
       * Dejamos también auditoría
       * de quién aprobó.
       */

      await supabase
        .from(
          "seller_applications"
        )
        .update({
          reviewed_by:
            admin.id,

          reviewed_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          application.id
        );

      return NextResponse.json({
        success: true,

        status:
          "APPROVED",

        approval,
      });
    }

    /* =========================================
     * INVITE
     * ========================================= */

    if (
      action === "INVITE"
    ) {
      if (
        application.status !==
          "APPROVED" ||
        !application.partner_id
      ) {
        return NextResponse.json(
          {
            error:
              "La solicitud debe estar aprobada antes de enviar la invitación.",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data: partner,
        error: partnerError,
      } = await supabase
        .from("partners")
        .select(`
          id,
          code,
          name,
          email,
          type,
          active,
          auth_user_id
        `)
        .eq(
          "id",
          application.partner_id
        )
        .maybeSingle();

      if (
        partnerError ||
        !partner
      ) {
        throw new Error(
          "Seller no encontrado."
        );
      }

      if (
        partner.auth_user_id
      ) {
        return NextResponse.json({
          success: true,
          alreadyInvited:
            true,

          seller: {
            code:
              partner.code,

            authUserId:
              partner.auth_user_id,
          },
        });
      }

      if (
        !partner.email
      ) {
        throw new Error(
          "El Seller no tiene correo registrado."
        );
      }

      const siteUrl =
        process.env
          .NEXT_PUBLIC_SITE_URL ??
        "http://localhost:3000";

      const redirectTo =
        `${siteUrl}/seller/activate`;

      const {
        data: inviteData,
        error: inviteError,
      } =
        await supabase.auth.admin
          .inviteUserByEmail(
            partner.email
              .trim()
              .toLowerCase(),
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
          "SELLER INVITE ERROR:",
          inviteError
        );

        throw new Error(
          inviteError?.message ??
            "No fue posible enviar la invitación."
        );
      }

      const {
        error: linkError,
      } = await supabase
        .from("partners")
        .update({
          auth_user_id:
            inviteData.user.id,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          partner.id
        );

      if (linkError) {
        throw new Error(
          "La invitación fue creada pero no fue posible vincular Auth al Seller."
        );
      }

      return NextResponse.json({
        success: true,

        invited:
          true,

        seller: {
          code:
            partner.code,

          authUserId:
            inviteData.user.id,
        },
      });
    }

    return NextResponse.json(
      {
        error:
          "Acción administrativa inválida.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN APPLICATION ACTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible procesar la solicitud.",
      },
      {
        status: 500,
      }
    );
  }
}