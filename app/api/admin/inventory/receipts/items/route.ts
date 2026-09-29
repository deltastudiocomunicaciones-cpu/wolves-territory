import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAuthenticated,
} from "@/lib/supabase-authenticated";

type UpsertReceiptItemBody = {
  receiptId?: string;
  inventoryId?: string;
  expectedQuantity?: number;
  receivedQuantity?: number | null;
  observation?: string | null;
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
      (await request.json()) as UpsertReceiptItemBody;

    const receiptId =
      body.receiptId?.trim();

    const inventoryId =
      body.inventoryId?.trim();

    const expectedQuantity =
      body.expectedQuantity;

    const receivedQuantity =
      body.receivedQuantity ?? null;

    const observation =
      body.observation?.trim() || null;

    if (
      !receiptId ||
      !inventoryId ||
      !Number.isInteger(expectedQuantity) ||
      expectedQuantity! < 0 ||
      (
        receivedQuantity !== null &&
        (
          !Number.isInteger(receivedQuantity) ||
          receivedQuantity < 0
        )
      )
    ) {
      return NextResponse.json(
        {
          error:
            "INVALID_RECEIPT_ITEM_INPUT",
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
      "upsert_inventory_receipt_item",
      {
        p_receipt_id:
          receiptId,
        p_inventory_id:
          inventoryId,
        p_expected_quantity:
          expectedQuantity!,
        p_received_quantity:
          receivedQuantity,
        p_observation:
          observation,
      }
    );

    if (error) {
      console.error(
        "INVENTORY RECEIPT ITEM UPSERT ERROR:",
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
            : "RECEIPT_ITEM_UPSERT_FAILED",
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
        receiptItemId: data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "INVENTORY RECEIPT ITEM API ERROR:",
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