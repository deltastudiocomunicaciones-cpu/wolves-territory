import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const applicationId = body?.applicationId;

    if (
      typeof applicationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        applicationId
      )
    ) {
      return NextResponse.json(
        { error: "Identificador inválido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "open_store_evaluation",
      { p_application_id: applicationId }
    );

    if (error) {
      const message = error.message ?? "";

      if (
        error.code === "42501" ||
        message.includes("STORE_EVALUATION_FORBIDDEN")
      ) {
        return NextResponse.json(
          { error: "No tienes permiso." },
          { status: 403 }
        );
      }

      if (
        error.code === "P0002" ||
        message.includes("STORE_APPLICATION_NOT_FOUND")
      ) {
        return NextResponse.json(
          { error: "Solicitud no encontrada." },
          { status: 404 }
        );
      }

      if (
        error.code === "23514" ||
        message.includes("STORE_APPLICATION_NOT_ELIGIBLE")
      ) {
        return NextResponse.json(
          { error: "La solicitud no permite abrir una evaluación." },
          { status: 409 }
        );
      }

      console.error("STORE_OPEN_EVALUATION_FAILED", error.code);

      return NextResponse.json(
        { error: "No fue posible abrir la evaluación." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluationId: data,
      evaluationVersion: "WT-SQ-V1",
    });
  } catch (cause) {
    console.error(
      "STORE_OPEN_EVALUATION_EXCEPTION",
      cause instanceof Error ? cause.message : "Unknown exception"
    );

    return NextResponse.json(
      { error: "No fue posible procesar la apertura del expediente." },
      { status: 500 }
    );
  }
}


