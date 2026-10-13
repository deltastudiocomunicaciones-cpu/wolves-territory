import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type StoreApplicationPayload = {
  legalName?: string;
  tradeName?: string;
  documentType?: string;
  documentNumber?: string;
  representativeName?: string;
  representativeDocumentType?: string;
  representativeDocumentNumber?: string;
  email?: string;
  phone?: string;
  city?: string;
  department?: string;
  businessAddress?: string;
  branchCount?: number;
  operatingCities?: string;
  businessDescription?: string;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  turnstileToken?: string;
};

const text = (value: unknown, max = 300): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const digits = (value: string) => value.replace(/\D/g, "");

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > 16384) {
      return NextResponse.json(
        { error: "La solicitud supera el tamaño permitido." },
        { status: 413 }
      );
    }

    const body = (await request.json()) as StoreApplicationPayload;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Solicitud inválida." },
        { status: 400 }
      );
    }

    const legalName = text(body.legalName, 200);
    const tradeName = text(body.tradeName, 200);
    const documentType = text(body.documentType || "NIT", 20).toUpperCase();
    const documentNumber = text(body.documentNumber, 40);
    const documentNormalized = digits(documentNumber);
    const representativeName = text(body.representativeName, 200);
    const representativeDocumentType = text(body.representativeDocumentType, 20);
    const representativeDocumentNumber = text(body.representativeDocumentNumber, 40);
    const email = text(body.email, 254).toLowerCase();
    const phone = digits(text(body.phone, 40));
    const city = text(body.city, 120);
    const department = text(body.department, 120);
    const businessAddress = text(body.businessAddress, 300);
    const operatingCities = text(body.operatingCities, 500);
    const businessDescription = text(body.businessDescription, 1500);
    const branchCount = Number(body.branchCount);

    if (
      !legalName ||
      !tradeName ||
      !documentNumber ||
      documentNormalized.length < 5 ||
      !representativeName ||
      !representativeDocumentType ||
      !representativeDocumentNumber ||
      !email ||
      !phone ||
      !city ||
      !businessAddress ||
      !Number.isInteger(branchCount) ||
      branchCount < 1 ||
      branchCount > 1000
    ) {
      return NextResponse.json(
        { error: "Completa correctamente los datos obligatorios." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (phone.length < 7) {
      return NextResponse.json(
        { error: "Ingresa un teléfono válido." },
        { status: 400 }
      );
    }

    if (body.privacyAccepted !== true || body.termsAccepted !== true) {
      return NextResponse.json(
        { error: "Debes aceptar las autorizaciones requeridas." },
        { status: 400 }
      );
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const turnstileToken = body.turnstileToken;

    if (!turnstileSecret) {
      console.error("STORE_TURNSTILE_NOT_CONFIGURED");

      return NextResponse.json(
        { error: "La verificación de seguridad no está disponible." },
        { status: 503 }
      );
    }

    if (
      typeof turnstileToken !== "string" ||
      !turnstileToken ||
      turnstileToken.length > 2048
    ) {
      return NextResponse.json(
        { error: "Completa la verificación de seguridad." },
        { status: 403 }
      );
    }

    let verified = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const verificationResponse = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              secret: turnstileSecret,
              response: turnstileToken,
            }),
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!verificationResponse.ok) {
          throw new Error("TURNSTILE_SITEVERIFY_HTTP_ERROR");
        }

        const verification = (await verificationResponse.json()) as {
          success?: boolean;
          hostname?: string;
          action?: string;
        };

        const allowedHosts = new Set([
          "localhost",
          "wolves-territory.co",
          "www.wolves-territory.co",
          "wolves-territory-gd027b7ss-delta-0f124680.vercel.app",
          "wolves-territory-git-feature-03b-store-preview-delta-0f124680.vercel.app",
        ]);

        verified =
          verification.success === true &&
          typeof verification.hostname === "string" &&
          allowedHosts.has(verification.hostname);
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      console.error("STORE_TURNSTILE_VERIFICATION_UNAVAILABLE");

      return NextResponse.json(
        { error: "No fue posible completar la verificación de seguridad." },
        { status: 503 }
      );
    }

    if (!verified) {
      return NextResponse.json(
        { error: "La verificación de seguridad no fue válida. Inténtalo nuevamente." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: rpcData, error } = await supabase
      .rpc("register_store_application", {
        p_application: {
          legal_name: legalName,
          trade_name: tradeName,
          document_type: documentType,
          document_number: documentNumber,
          representative_name: representativeName,
          representative_document_type: representativeDocumentType,
          representative_document_number: representativeDocumentNumber,
          email,
          phone,
          city,
          department: department || null,
          business_address: businessAddress,
          branch_count: branchCount,
          operating_cities: operatingCities || null,
          business_description: businessDescription || null,
          privacy_accepted: true,
          terms_accepted: true,
        },
      });

    const registered = rpcData?.[0];

    const data = registered
      ? {
          id: registered.application_id,
          status: registered.application_status,
        }
      : null;
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe una solicitud con este correo o documento." },
          { status: 409 }
        );
      }

      console.error("STORE_APPLICATION_INSERT_FAILED", {
        code: error.code,
        message: error.message,
      });

      return NextResponse.json(
        { error: "No fue posible registrar la solicitud." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        application: data,
        message: "Recibimos tu solicitud de afiliación comercial.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("STORE_APPLICATION_ERROR", error);

    return NextResponse.json(
      { error: "No fue posible procesar la solicitud." },
      { status: 400 }
    );
  }
}

