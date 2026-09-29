import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

type CreateReceiptBody = {
  reference?: string;
  receiptType?: string;
  source?: string | null;
  notes?: string | null;
};

function getBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

  return token || null;
}

export async function POST(
  request: NextRequest
) {
  try {
    const accessToken =
      getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "AUTHENTICATION_REQUIRED",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as CreateReceiptBody;

    const reference =
      body.reference?.trim();

    const receiptType =
      body.receiptType?.trim() ||
      "STANDARD";

    const source =
      body.source?.trim() || null;

    const notes =
      body.notes?.trim() || null;

    if (!reference) {
      return NextResponse.json(
        {
          error: "REFERENCE_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAuthenticated(
        accessToken
      );

    /*
     * Validate that the supplied JWT represents
     * an active Supabase Auth session.
     *
     * Authorization for the command itself remains
     * inside PostgreSQL through
     * assert_platform_permission().
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
          error: "INVALID_SESSION",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "create_inventory_receipt",
      {
        p_reference: reference,
        p_receipt_type:
          receiptType,
        p_source: source,
        p_notes: notes,
      }
    );

    if (error) {
      console.error(
        "INVENTORY RECEIPT CREATE ERROR:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );

      const forbidden =
        error.code === "42501";

      return NextResponse.json(
        {
          error: forbidden
            ? "PERMISSION_DENIED"
            : "RECEIPT_CREATE_FAILED",
          detail: error.message,
        },
        {
          status: forbidden
            ? 403
            : 400,
        }
      );
    }

    return NextResponse.json(
      {
        receipt: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "INVENTORY RECEIPT API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}