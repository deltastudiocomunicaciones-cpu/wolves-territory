import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DIMENSIONS = new Set([
  "BRAND_FIT",
  "COMMERCIAL_POTENTIAL",
  "LOCATION_MARKET",
  "OPERATIONAL_CAPACITY",
  "CUSTODY_SECURITY",
  "BUSINESS_STRENGTH",
  "REPUTATION",
  "DIGITAL_CAPABILITY",
  "STRATEGIC_POTENTIAL",
]);

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Sesión requerida." },
        { status: 401 }
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

    const body = await request.json();

    const evaluationId = body?.evaluationId;
    const dimensionCode = body?.dimensionCode;
    const score = body?.score;
    const justification = body?.justification;
    const evidenceReference = body?.evidenceReference;

    if (
      typeof evaluationId !== "string" ||
      !UUID_PATTERN.test(evaluationId) ||
      typeof dimensionCode !== "string" ||
      !DIMENSIONS.has(dimensionCode) ||
      !Number.isInteger(score) ||
      score < 1 ||
      score > 5 ||
      typeof justification !== "string" ||
      !justification.trim() ||
      justification.length > 2000 ||
      (evidenceReference != null &&
        (typeof evidenceReference !== "string" ||
          evidenceReference.length > 2000))
    ) {
      return NextResponse.json(
        { error: "Datos de calificación inválidos." },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc(
      "save_store_evaluation_score",
      {
        p_evaluation_id: evaluationId,
        p_dimension_code: dimensionCode,
        p_score: score,
        p_justification: justification.trim(),
        p_evidence_reference:
          typeof evidenceReference === "string"
            ? evidenceReference.trim() || null
            : null,
      }
    );

    if (error) {
      console.error("STORE_SCORE_SAVE_FAILED", error.code);

      const status =
        error.code === "42501" ? 403 :
        error.code === "P0002" ? 404 :
        error.code === "23514" ? 409 : 500;

      return NextResponse.json(
        { error: "No fue posible registrar la calificación." },
        { status }
      );
    }

    return NextResponse.json({
      saved: true,
      evaluationId,
      dimensionCode,
    });
  } catch (cause) {
    console.error(
      "STORE_SCORE_SAVE_EXCEPTION",
      cause instanceof Error ? cause.message : "Unknown exception"
    );

    return NextResponse.json(
      { error: "Error inesperado al registrar la calificación." },
      { status: 500 }
    );
  }
}
