import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

type CreateCountBody = {
  countType?: string;
  notes?: string | null;
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
      (await request.json()) as CreateCountBody;

    const countType =
      body.countType?.trim().toUpperCase() ||
      "STANDARD";

    const notes =
      body.notes?.trim() || null;

    if (
      countType !== "STANDARD" &&
      countType !== "FULL"
    ) {
      return NextResponse.json(
        { error: "COUNT_TYPE_INVALID" },
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
      "create_inventory_count",
      {
        p_count_type: countType,
        p_notes: notes,
      }
    );

    if (error) {
      console.error(
        "INVENTORY COUNT CREATE ERROR:",
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
            : "COUNT_CREATE_FAILED",
          detail: error.message,
        },
        {
          status: forbidden ? 403 : 400,
        }
      );
    }

    return NextResponse.json(
      { count: data },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "INVENTORY COUNT API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
