import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

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
      Array.isArray(body) ||
      !("applicationId" in body) ||
      typeof body.applicationId !== "string"
    ) {
      return NextResponse.json(
        { error: "APPLICATION_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const applicationId = body.applicationId.trim();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(applicationId)) {
      return NextResponse.json(
        { error: "INVALID_APPLICATION_ID" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "start_store_application_review",
      { p_application_id: applicationId }
    );

    if (error) {
      console.error("STORE APPLICATION REVIEW ERROR:", {
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

      return NextResponse.json(
        { error: "STORE_APPLICATION_REVIEW_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        applicationId: data,
        status: "UNDER_REVIEW",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("STORE APPLICATION REVIEW API ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
