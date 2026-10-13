import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase.rpc(
      "get_commercial_store_applications"
    );

    if (error) {
      console.error("STORE APPLICATIONS READ ERROR:", {
        code: error.code,
        message: error.message,
      });

      if (error.code === "42501") {
        return NextResponse.json(
          { error: "PERMISSION_DENIED" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "STORE_APPLICATIONS_READ_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { applications: data ?? [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("STORE APPLICATIONS API ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
