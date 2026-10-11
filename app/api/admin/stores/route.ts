
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthenticated } from "@/lib/supabase-authenticated";

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

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
      "get_commercial_stores"
    );

    if (error) {
      console.error("STORE REGISTRY READ ERROR:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42501") {
        return NextResponse.json(
          { error: "PERMISSION_DENIED" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "STORE_REGISTRY_READ_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { stores: data ?? [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("STORE REGISTRY API ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

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

    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("application/json")) {
      return NextResponse.json(
        { error: "INVALID_CONTENT_TYPE" },
        { status: 415 }
      );
    }

    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).length > 8192) {
      return NextResponse.json(
        { error: "REQUEST_TOO_LARGE" },
        { status: 413 }
      );
    }

    let payload: unknown;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const body = payload as Record<string, unknown>;

    const allowedFields = new Set([
      "code",
      "trade_name",
      "legal_name",
      "document_type",
      "document_number",
      "email",
      "phone",
    ]);

    if (Object.keys(body).some((key) => !allowedFields.has(key))) {
      return NextResponse.json(
        { error: "UNSUPPORTED_FIELDS" },
        { status: 400 }
      );
    }

    const readText = (
      key: string,
      required = false
    ): string | null | undefined => {
      const value = body[key];

      if (value === undefined || value === null) {
        return required ? undefined : null;
      }

      if (typeof value !== "string") {
        return undefined;
      }

      const normalized = value.trim();

      if (required && !normalized) {
        return undefined;
      }

      return normalized || null;
    };

    const code = readText("code", true);
    const tradeName = readText("trade_name", true);
    const legalName = readText("legal_name");
    const documentType = readText("document_type");
    const documentNumber = readText("document_number");
    const email = readText("email");
    const phone = readText("phone");

    if (
      !code ||
      !tradeName ||
      legalName === undefined ||
      documentType === undefined ||
      documentNumber === undefined ||
      email === undefined ||
      phone === undefined
    ) {
      return NextResponse.json(
        { error: "INVALID_STORE_DATA" },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase();

    if (
      !/^[A-Z][A-Z0-9_-]*$/.test(normalizedCode) ||
      normalizedCode.length > 64 ||
      tradeName.length > 200 ||
      [legalName, documentType, documentNumber, email, phone].some(
        (value) => value !== null && value.length > 255
      ) ||
      Boolean(documentType) !== Boolean(documentNumber)
    ) {
      return NextResponse.json(
        { error: "INVALID_STORE_DATA" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "create_commercial_store",
      {
        p_code: normalizedCode,
        p_trade_name: tradeName,
        p_legal_name: legalName,
        p_document_type: documentType,
        p_document_number: documentNumber,
        p_email: email,
        p_phone: phone,
      }
    );

    if (error) {
      console.error("STORE CREATE RPC ERROR:", {
        code: error.code,
        message: error.message,
      });

      if (error.code === "42501") {
        return NextResponse.json(
          { error: "PERMISSION_DENIED" },
          { status: 403 }
        );
      }

      if (error.code === "23505") {
        return NextResponse.json(
          { error: "STORE_ALREADY_EXISTS" },
          { status: 409 }
        );
      }

      if (
        error.code === "22023" ||
        error.code === "23514" ||
        error.code === "23502"
      ) {
        return NextResponse.json(
          { error: "INVALID_STORE_DATA" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "STORE_CREATE_FAILED" },
        { status: 500 }
      );
    }

    const store = Array.isArray(data) ? data[0] : null;

    if (!store) {
      return NextResponse.json(
        { error: "STORE_CREATE_EMPTY_RESULT" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { store },
      { status: 201 }
    );
  } catch (error) {
    console.error("STORE CREATE API ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
