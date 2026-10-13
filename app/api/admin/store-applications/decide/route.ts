import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7).trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAuthenticated(accessToken);

    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "INVALID_SESSION" },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    const applicationId = payload.applicationId;
    const decision = payload.decision;
    const notes = payload.notes;

    if (
      typeof applicationId !== "string" ||
      !uuidPattern.test(applicationId.trim())
    ) {
      return NextResponse.json(
        { error: "INVALID_APPLICATION_ID" },
        { status: 400 }
      );
    }

    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json(
        { error: "INVALID_DECISION" },
        { status: 400 }
      );
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return NextResponse.json(
        { error: "INVALID_NOTES" },
        { status: 400 }
      );
    }

    const reviewNotes =
      typeof notes === "string" ? notes.trim() : "";

    if (
      reviewNotes.length > 2000 ||
      (decision === "REJECTED" && !reviewNotes)
    ) {
      return NextResponse.json(
        { error: "INVALID_REVIEW_NOTES" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "decide_store_application",
      {
        p_application_id: applicationId.trim(),
        p_decision: decision,
        p_notes: reviewNotes || null,
      }
    );

    if (error) {
      console.error("STORE APPLICATION DECISION ERROR:", {
        code: error.code,
        message: error.message,
      });

      if (error.code === "42501") {
        return NextResponse.json(
          { error: "PERMISSION_DENIED" },
          { status: 403 }
        );
      }

      if (error.code === "P0002") {
        return NextResponse.json(
          { error: "APPLICATION_NOT_FOUND" },
          { status: 404 }
        );
      }

      if (error.code === "23514" || error.code === "40001") {
        return NextResponse.json(
          { error: "APPLICATION_STATE_CONFLICT" },
          { status: 409 }
        );
      }

      if (error.code === "22023") {
        return NextResponse.json(
          { error: "INVALID_DECISION_DATA" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "STORE_APPLICATION_DECISION_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        applicationId: data,
        status: decision,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("STORE APPLICATION DECISION API ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
