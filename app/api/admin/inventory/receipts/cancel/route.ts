import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

type CancelReceiptBody = { receiptId?: string; reason?: string };

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    if (!token) return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });

    const body = (await request.json()) as CancelReceiptBody;
    const receiptId = body.receiptId?.trim();
    const reason = body.reason?.trim();
    if (!receiptId || !/^[0-9a-fA-F-]{36}$/.test(receiptId)) {
      return NextResponse.json({ error: "RECEIPT_ID_INVALID" }, { status: 400 });
    }
    if (!reason || reason.length < 15 || reason.length > 1000) {
      return NextResponse.json({ error: "CANCELLATION_REASON_INVALID" }, { status: 400 });
    }

    const supabase = getSupabaseAuthenticated(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "INVALID_SESSION" }, { status: 401 });
    }

    // DB enforces INVENTORY_RECEIPT_APPROVE, empty DRAFT, audit, no stock movements.
    const { error } = await supabase.rpc("cancel_inventory_receipt", {
      p_receipt_id: receiptId,
      p_reason: reason,
    });
    if (error) {
      console.error("INVENTORY RECEIPT CANCEL ERROR:", { code: error.code, message: error.message });
      const denied = error.code === "42501";
      const absent = error.code === "P0002";
      return NextResponse.json({
        error: denied ? "PERMISSION_DENIED" : absent ? "RECEIPT_NOT_FOUND" : error.message,
      }, { status: denied ? 403 : absent ? 404 : 409 });
    }
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    console.error("INVENTORY RECEIPT CANCEL API ERROR:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
