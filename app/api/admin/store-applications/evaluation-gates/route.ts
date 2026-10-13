
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GATE_CODES = new Set(
  Array.from(
    { length: 12 },
    (_, index) => `G${String(index + 1).padStart(2, "0")}`
  )
);

const GATE_STATUSES = new Set([
  "PENDING",
  "PASS",
  "FAIL",
  "NOT_APPLICABLE",
]);

async function authorizedClient(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  if (!token) return null;

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

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;

  return supabase;
}

function databaseError(code: string | undefined) {
  const status =
    code === "42501" ? 403 :
    code === "P0002" ? 404 :
    code === "23514" ? 400 :
    code === "P0001" ? 409 : 500;

  return NextResponse.json(
    { error: "No fue posible procesar el requisito institucional." },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await authorizedClient(request);

    if (!supabase) {
      return NextResponse.json(
        { error: "Sesión inválida o ausente." },
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

    const { data, error } = await supabase.rpc(
      "get_store_evaluation_gates",
      { p_evaluation_id: evaluationId }
    );

    if (error) {
      console.error("STORE_GATES_READ_FAILED", error.code);
      return databaseError(error.code);
    }

    return NextResponse.json(
      { evaluationId, gates: data ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "STORE_GATES_READ_EXCEPTION",
      error instanceof Error ? error.message : "Unknown"
    );

    return NextResponse.json(
      { error: "Error inesperado al consultar los requisitos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await authorizedClient(request);

    if (!supabase) {
      return NextResponse.json(
        { error: "Sesión inválida o ausente." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      evaluationId,
      gateCode,
      status,
      justification,
      evidenceReference,
    } = body ?? {};

    if (
      typeof evaluationId !== "string" ||
      !UUID_PATTERN.test(evaluationId) ||
      typeof gateCode !== "string" ||
      !GATE_CODES.has(gateCode) ||
      typeof status !== "string" ||
      !GATE_STATUSES.has(status)
    ) {
      return NextResponse.json(
        { error: "Datos del requisito inválidos." },
        { status: 400 }
      );
    }

    if (
      typeof justification !== "string" ||
      justification.length > 2000 ||
      (status !== "PENDING" && !justification.trim()) ||
      (evidenceReference != null &&
        (typeof evidenceReference !== "string" ||
          evidenceReference.length > 2000))
    ) {
      return NextResponse.json(
        { error: "Justificación o evidencia inválida." },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc(
      "save_store_evaluation_gate",
      {
        p_evaluation_id: evaluationId,
        p_gate_code: gateCode,
        p_status: status,
        p_justification: justification.trim() || null,
        p_evidence_reference:
          evidenceReference?.trim() || null,
      }
    );

    if (error) {
      console.error("STORE_GATES_SAVE_FAILED", error.code);
      return databaseError(error.code);
    }

    return NextResponse.json({
      saved: true,
      evaluationId,
      gateCode,
      status,
    });
  } catch (error) {
    console.error(
      "STORE_GATES_SAVE_EXCEPTION",
      error instanceof Error ? error.message : "Unknown"
    );

    return NextResponse.json(
      { error: "Error inesperado al guardar el requisito." },
      { status: 500 }
    );
  }
}
