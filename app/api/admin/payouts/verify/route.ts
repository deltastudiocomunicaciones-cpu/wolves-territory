import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type VerifyPayload = {
  accessToken?: string;
  payoutAccountId?: string;
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

    // 1. Validar identidad Auth
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(body.accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Sesión administrativa inválida." },
        { status: 401 }
      );
    }

    // 2. Confirmar que realmente sea administrador
    const {
      data: admin,
      error: adminError,
    } = await supabase
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

    if (
      !["ADMIN", "SUPER_ADMIN", "FINANCE"].includes(admin.role)
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para verificar cuentas." },
        { status: 403 }
      );
    }

    // 3. Comprobar cuenta
    const {
      data: account,
      error: accountError,
    } = await supabase
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

    if (account.verified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        account,
      });
    }

    // 4. Verificar
    const now = new Date().toISOString();

    const {
      data: verifiedAccount,
      error: verifyError,
    } = await supabase
      .from("partner_payout_accounts")
      .update({
        verified: true,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", account.id)
      .eq("active", true)
      .eq("verified", false)
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
      .single();

    if (verifyError || !verifiedAccount) {
      console.error(
        "PAYOUT VERIFY ERROR:",
        verifyError
      );

      throw new Error(
        "No fue posible verificar la cuenta."
      );
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
    console.error(
      "ADMIN PAYOUT VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible verificar la cuenta.",
      },
      { status: 500 }
    );
  }
}