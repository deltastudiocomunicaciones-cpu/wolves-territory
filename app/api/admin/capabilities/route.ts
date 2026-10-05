import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAuthenticated,
} from "@/lib/supabase-authenticated";

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

export async function GET(
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

    const supabase =
      getSupabaseAuthenticated(
        accessToken
      );

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(
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
      data: canApplyInventoryReceipt,
      error: applyPermissionError,
    } = await supabase.rpc(
      "has_platform_permission",
      {
        p_permission_code:
          "INVENTORY_RECEIPT_APPLY",
      }
    );

    if (applyPermissionError) {
      console.error(
        "ADMIN CAPABILITIES ERROR:",
        {
          message:
            applyPermissionError.message,
          details:
            applyPermissionError.details,
          hint:
            applyPermissionError.hint,
          code:
            applyPermissionError.code,
        }
      );

      return NextResponse.json(
        {
          error:
            "CAPABILITIES_RESOLUTION_FAILED",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        capabilities: {
          canApplyInventoryReceipt:
            canApplyInventoryReceipt === true,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN CAPABILITIES API ERROR:",
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