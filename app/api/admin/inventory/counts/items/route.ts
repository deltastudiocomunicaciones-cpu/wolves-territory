import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

type UpsertCountItemBody = {
  countId?: string;
  inventoryId?: string;
  physicalStock?: number;
  observation?: string | null;
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
      (await request.json()) as UpsertCountItemBody;

    const countId =
      body.countId?.trim();

    const inventoryId =
      body.inventoryId?.trim();

    const physicalStock =
      body.physicalStock;

    const observation =
      body.observation?.trim() || null;

    if (
      !countId ||
      !inventoryId ||
      !Number.isInteger(physicalStock) ||
      physicalStock! < 0
    ) {
      return NextResponse.json(
        { error: "INVALID_COUNT_ITEM_INPUT" },
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
      "upsert_inventory_count_item",
      {
        p_count_id: countId,
        p_inventory_id: inventoryId,
        p_physical_stock: physicalStock!,
        p_observation: observation,
      }
    );

    if (error) {
      console.error(
        "INVENTORY COUNT ITEM UPSERT ERROR:",
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
            : "COUNT_ITEM_UPSERT_FAILED",
          detail: error.message,
        },
        {
          status: forbidden ? 403 : 400,
        }
      );
    }

    return NextResponse.json(
      { countItem: data },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "INVENTORY COUNT ITEM API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
