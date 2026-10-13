import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Sesión requerida." },
        { status: 401 }
      );
    }

    const evaluationId =
      request.nextUrl.searchParams.get("evaluationId");

    if (!evaluationId || !UUID_PATTERN.test(evaluationId)) {
      return NextResponse.json(
        { error: "Identificador de evaluación inválido." },
        { status: 400 }
      );
    }

    const token = authorization.slice(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Sesión inválida." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc(
      "get_store_evaluation_scores",
      { p_evaluation_id: evaluationId }
    );

    if (error) {
      console.error("STORE_SCORES_READ_FAILED", error.code);

      const status =
        error.code === "42501" ? 403 :
        error.code === "P0002" ? 404 : 500;

      return NextResponse.json(
        { error: "No fue posible consultar las calificaciones." },
        { status }
      );
    }

    return NextResponse.json(
      { evaluationId, scores: data ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (cause) {
    console.error(
      "STORE_SCORES_READ_EXCEPTION",
      cause instanceof Error ? cause.message : "Unknown exception"
    );

    return NextResponse.json(
      { error: "Error inesperado al consultar las calificaciones." },
      { status: 500 }
    );
  }
}
