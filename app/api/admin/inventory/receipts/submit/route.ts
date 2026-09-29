import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAuthenticated,
} from "@/lib/supabase-authenticated";

type SubmitReceiptBody = {
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
          error:
            "AUTHENTICATION_REQUIRED",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as
        SubmitReceiptBody;

    const receiptId =
      body.receiptId?.trim();

    if (!receiptId) {
      return NextResponse.json(
        {
          error:
            "RECEIPT_ID_REQUIRED",
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
          error:
            "INVALID_SESSION",
        },
        {
          status: 401,
        }
      );
    }

    const {
      error,
    } = await supabase.rpc(
      "submit_inventory_receipt",
      {
        p_receipt_id: receiptId,
      }
    );

    if (error) {
      console.error(
        "INVENTORY RECEIPT SUBMIT ERROR:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          receiptId,
        }
      );

      const forbidden =
        error.code === "42501";

      return NextResponse.json(
        {
          error: forbidden
            ? "PERMISSION_DENIED"
            : "RECEIPT_SUBMIT_FAILED",
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
        submitted: true,
        receiptId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "INVENTORY RECEIPT SUBMIT API ERROR:",
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