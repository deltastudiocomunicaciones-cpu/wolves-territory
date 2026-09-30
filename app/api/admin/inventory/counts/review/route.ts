import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

type ReviewAdjustmentBody = {
  countId?: string;
  decision?: string;
  reason?: string | null;
};

function getBearerToken(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as ReviewAdjustmentBody;

    const countId =
      body.countId?.trim();

    const decision =
      body.decision?.trim().toUpperCase();

    const reason =
      body.reason?.trim() || null;

    if (!countId) {
      return NextResponse.json(
        { error: "COUNT_ID_REQUIRED" },
        { status: 400 }
      );
    }

    if (
      decision !== "APPROVE" &&
      decision !== "REJECT"
    ) {
      return NextResponse.json(
        { error: "REVIEW_DECISION_INVALID" },
        { status: 400 }
      );
    }

    if (
      decision === "REJECT" &&
      !reason
    ) {
      return NextResponse.json(
        { error: "REJECTION_REASON_REQUIRED" },
        { status: 400 }
      );
    }

    const supabase =
      getSupabaseAuthenticated(accessToken);

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "INVALID_SESSION" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc(
      "review_inventory_adjustment",
      {
        p_count_id: countId,
        p_decision: decision,
        p_reason: reason,
      }
    );

    if (error) {
      console.error(
        "INVENTORY ADJUSTMENT REVIEW ERROR:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );

      const forbidden =
        error.code === "42501";

      const conflict =
        error.code === "23505";

      return NextResponse.json(
        {
          error: forbidden
            ? "PERMISSION_DENIED"
            : conflict
              ? "ADJUSTMENT_MOVEMENT_CONFLICT"
              : "ADJUSTMENT_REVIEW_FAILED",
          detail: error.message,
        },
        {
          status: forbidden
            ? 403
            : conflict
              ? 409
              : 400,
        }
      );
    }

    return NextResponse.json(
      {
        reviewed: true,
        countId,
        decision,
        result: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "INVENTORY ADJUSTMENT REVIEW API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
