import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAuthenticated,
} from "@/lib/supabase-authenticated";

type ApplyReceiptBody = {
  receiptId?: string;
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
      (await request.json()) as ApplyReceiptBody;

    const receiptId =
      body.receiptId?.trim();

    if (!receiptId) {
      return NextResponse.json(
        {
          error: "RECEIPT_ID_REQUIRED",
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
      "apply_inventory_receipt",
      {
        p_receipt_id: receiptId,
      }
    );

    if (error) {
      console.error(
        "INVENTORY RECEIPT APPLY ERROR:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );

      const forbidden =
        error.code === "42501";

      const invalidInput =
        error.code === "22023";

      const invalidState =
        error.code === "55000";

      const notFound =
        error.code === "P0002";

      const conflict =
        error.code === "23505";

      return NextResponse.json(
        {
          error:
            forbidden
              ? "PERMISSION_DENIED"
              : invalidInput
                ? "INVALID_RECEIPT"
                : invalidState
                  ? "RECEIPT_NOT_APPROVED"
                  : notFound
                    ? "RECEIPT_NOT_FOUND"
                    : conflict
                      ? "RECEIPT_MOVEMENT_CONFLICT"
                      : "RECEIPT_APPLY_FAILED",
          detail: error.message,
        },
        {
          status:
            forbidden
              ? 403
              : notFound
                ? 404
                : conflict
                  ? 409
                  : 400,
        }
      );
    }

    return NextResponse.json(
      {
        applied: true,
        receiptId,
        result: data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "INVENTORY RECEIPT APPLY API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}