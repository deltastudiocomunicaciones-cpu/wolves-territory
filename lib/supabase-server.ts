import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const rawSupabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const rawServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawSupabaseUrl || !rawServiceRoleKey) {
    throw new Error(
      "Supabase server environment variables are missing."
    );
  }

  // Limpiamos espacios y saltos accidentales
  // provenientes de variables de entorno.
  const supabaseUrl =
    rawSupabaseUrl.trim();

  const serviceRoleKey =
    rawServiceRoleKey.replace(/\s+/g, "");

  if (
    !supabaseUrl.startsWith("https://") ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase server environment variables are invalid."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}