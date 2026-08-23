import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase-server";

type SellerApplicationPayload = {
  fullName?: string;
  documentType?: string;
  documentNumber?: string;

  email?: string;
  phone?: string;
  city?: string;

  instagram?: string;
  referralSource?: string;
  motivation?: string;

  privacyAccepted?: boolean;
  termsAccepted?: boolean;
};

function normalizeEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeDocument(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}

function cleanText(
  value?: string
) {
  return value?.trim() || null;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        SellerApplicationPayload;

    /* =====================================================
     * NORMALIZACIÓN
     * ===================================================== */

    const fullName =
      cleanText(
        body.fullName
      );

    const documentType =
      cleanText(
        body.documentType
      ) ?? "CC";

    const documentNumber =
      cleanText(
        body.documentNumber
      );

    const email =
      body.email
        ? normalizeEmail(
            body.email
          )
        : null;

    const phone =
      cleanText(
        body.phone
      );

    const city =
      cleanText(
        body.city
      );

    const instagram =
      cleanText(
        body.instagram
      );

    const referralSource =
      cleanText(
        body.referralSource
      );

    const motivation =
      cleanText(
        body.motivation
      );

    const privacyAccepted =
      body.privacyAccepted ===
      true;

    const termsAccepted =
      body.termsAccepted ===
      true;

    /* =====================================================
     * REQUIRED FIELDS
     * ===================================================== */

    if (
      !fullName ||
      !documentNumber ||
      !email ||
      !phone ||
      !city
    ) {
      return NextResponse.json(
        {
          error:
            "Completa todos los campos obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
     * CONSENTS
     * ===================================================== */

    if (
      !privacyAccepted ||
      !termsAccepted
    ) {
      return NextResponse.json(
        {
          error:
            "Debes aceptar el tratamiento de datos y los términos de aplicación.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
     * BASIC EMAIL VALIDATION
     * ===================================================== */

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresa un correo electrónico válido.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
     * DOCUMENT NORMALIZATION
     * ===================================================== */

    const normalizedDocument =
      normalizeDocument(
        documentNumber
      );

    if (
      normalizedDocument.length <
      5
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresa un documento válido.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
     * PHONE VALIDATION
     * ===================================================== */

    const normalizedPhone =
      phone.replace(
        /\D/g,
        ""
      );

    if (
      normalizedPhone.length <
      7
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresa un teléfono válido.",
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

    /* =====================================================
     * DUPLICATE CHECK
     *
     * Buscamos primero para devolver
     * una respuesta amigable.
     * Los UNIQUE indexes siguen siendo
     * nuestra protección final.
     * ===================================================== */

    const {
      data: existingApplication,
      error:
        existingApplicationError,
    } = await supabase
      .from(
        "seller_applications"
      )
      .select(
        `
        id,
        email_normalized,
        document_normalized,
        status
        `
      )
      .or(
        `email_normalized.eq.${email},document_normalized.eq.${normalizedDocument}`
      )
      .maybeSingle();

    if (
      existingApplicationError
    ) {
      console.error(
        "SELLER APPLICATION LOOKUP ERROR:",
        {
          message:
            existingApplicationError.message,
          details:
            existingApplicationError.details,
          hint:
            existingApplicationError.hint,
          code:
            existingApplicationError.code,
        }
      );

      throw new Error(
        "No fue posible validar la solicitud."
      );
    }

    if (
      existingApplication
    ) {
      return NextResponse.json(
        {
          error:
            "Ya existe una solicitud asociada a este correo o documento.",
          status:
            existingApplication.status,
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
     * INSERT APPLICATION
     * ===================================================== */

    const {
      data: application,
      error: insertError,
    } = await supabase
      .from(
        "seller_applications"
      )
      .insert({
        full_name:
          fullName,

        document_type:
          documentType,

        document_number:
          documentNumber,

        document_normalized:
          normalizedDocument,

        email,

        email_normalized:
          email,

        phone:
          normalizedPhone,

        city,

        instagram,

        referral_source:
          referralSource,

        motivation,

        status:
          "APPLIED",

        privacy_accepted:
          true,

        terms_accepted:
          true,
      })
      .select(
        `
        id,
        full_name,
        email,
        status,
        created_at
        `
      )
      .single();

    if (
      insertError ||
      !application
    ) {
      console.error(
        "SELLER APPLICATION INSERT ERROR:",
        {
          message:
            insertError?.message,
          details:
            insertError?.details,
          hint:
            insertError?.hint,
          code:
            insertError?.code,
        }
      );

      if (
        insertError?.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "Ya existe una solicitud asociada a este correo o documento.",
          },
          {
            status: 409,
          }
        );
      }

      throw new Error(
        "No fue posible registrar la solicitud."
      );
    }

    /* =====================================================
     * SUCCESS
     * ===================================================== */

    console.log(
      "SELLER APPLICATION CREATED:",
      {
        id:
          application.id,

        status:
          application.status,
      }
    );

    return NextResponse.json(
      {
        success: true,

        application: {
          id:
            application.id,

          status:
            application.status,
        },

        message:
          "Tu solicitud fue recibida correctamente.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Seller application error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible enviar la solicitud.",
      },
      {
        status: 500,
      }
    );
  }
}