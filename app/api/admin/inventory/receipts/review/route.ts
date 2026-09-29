import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAuthenticated,
} from "@/lib/supabase-authenticated";

type ReviewReceiptBody = {
  receiptId?: string;
  decision?: string;
  reason?: string | null;
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
      (await request.json()) as ReviewReceiptBody;

    const receiptId =
      body.receiptId?.trim();

    const decision =
      body.decision?.trim().toUpperCase();

    const reason =
      body.reason?.trim() || null;

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

    if (
      decision !== "APPROVE" &&
      decision !== "REJECT"
    ) {
      return NextResponse.json(
        {
          error: "REVIEW_DECISION_INVALID",
        },
        {
          status: 400,
        }
      );
    }

    if (
      decision === "REJECT" &&
      !reason
    ) {
      return NextResponse.json(
        {
          error: "REJECTION_REASON_REQUIRED",
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
      error,
    } = await supabase.rpc(
      "review_inventory_receipt",
      {
        p_receipt_id: receiptId,
        p_decision: decision,
        p_reason: reason,
      }
    );

    if (error) {
      console.error(
        "INVENTORY RECEIPT REVIEW ERROR:",
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

      return NextResponse.json(
        {
          error:
            forbidden
              ? "PERMISSION_DENIED"
              : invalidInput
                ? "INVALID_REVIEW"
                : invalidState
                  ? "RECEIPT_NOT_REVIEWABLE"
                  : notFound
                    ? "RECEIPT_NOT_FOUND"
                    : "RECEIPT_REVIEW_FAILED",
          detail: error.message,
        },
        {
          status:
            forbidden
              ? 403
              : notFound
                ? 404
                : 400,
        }
      );
    }

    return NextResponse.json(
      {
        reviewed: true,
        receiptId,
        decision,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "INVENTORY RECEIPT REVIEW API ERROR:",
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