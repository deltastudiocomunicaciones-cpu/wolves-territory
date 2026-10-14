import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseUserClient } from "@/lib/supabase-user-server";

type VerifyPayload = {
  accessToken?: string;
  payoutAccountId?: string;
};

type VerifyRpcResult = {
  success: boolean;
  alreadyVerified: boolean;
  accountId: string;
  auditEventId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPayload;

    if (!body.accessToken || !body.payoutAccountId) {
      return NextResponse.json(
        { error: "Solicitud incompleta." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(body.accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Sesión administrativa inválida." },
        { status: 401 }
      );
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("id, full_name, role, active")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (adminError || !admin || !admin.active) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 403 }
      );
    }

    if (!["ADMIN", "SUPER_ADMIN", "FINANCE"].includes(admin.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para verificar cuentas." },
        { status: 403 }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("partner_payout_accounts")
      .select(`
        id,
        partner_id,
        bank_name,
        account_type,
        account_last4,
        verified,
        active
      `)
      .eq("id", body.payoutAccountId)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada." },
        { status: 404 }
      );
    }

    if (!account.active) {
      return NextResponse.json(
        { error: "La cuenta bancaria no está activa." },
        { status: 409 }
      );
    }


    // La verificación y su auditoría ocurren en una sola
    // transacción PostgreSQL, ejecutada con el JWT del usuario.
    const userClient = getSupabaseUserClient(body.accessToken);

    const { data, error: verifyError } = await userClient.rpc(
      "verify_partner_payout_account",
      { p_account_id: account.id }
    );

    if (verifyError) {
      console.error("PAYOUT VERIFY RPC ERROR:", verifyError);

      return NextResponse.json(
        { error: "No fue posible verificar la cuenta." },
        { status: 500 }
      );
    }

    const result = data as VerifyRpcResult | null;

    if (
      !result ||
      result.success !== true ||
      result.accountId !== account.id ||
      typeof result.alreadyVerified !== "boolean" ||
      (result.alreadyVerified === false &&
        !result.auditEventId)
    ) {
      throw new Error("Respuesta de verificación inválida.");
    }

    // Lectura posterior para preservar el contrato del frontend.
    const { data: verifiedAccount, error: readError } =
      await supabase
        .from("partner_payout_accounts")
        .select(`
          id,
          partner_id,
          bank_name,
          account_type,
          account_last4,
          verified,
          verified_at,
          active
        `)
        .eq("id", account.id)
        .single();

    if (readError || !verifiedAccount || !verifiedAccount.verified) {
      throw new Error(
        "No fue posible consultar la cuenta verificada."
      );
    }

    if (result.alreadyVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        account: verifiedAccount,
      });
    }

    return NextResponse.json({
      success: true,
      alreadyVerified: false,
      account: verifiedAccount,
      verifiedBy: {
        name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("ADMIN PAYOUT VERIFY ERROR:", error);

    return NextResponse.json(
      { error: "No fue posible verificar la cuenta." },
      { status: 500 }
    );
  }
}
