import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client that preserves
 * the authenticated user's JWT.
 *
 * Security boundary:
 * - Never uses service_role.
 * - Never accepts a user ID as identity.
 * - PostgreSQL resolves the actor through auth.uid().
 * - Permission Engine remains authoritative.
 */
export function getSupabaseAuthenticated(
  accessToken: string
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const token = accessToken.trim();

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Supabase authenticated environment variables are missing."
    );
  }

  if (!token) {
    throw new Error(
      "Authenticated Supabase access token is required."
    );
  }

  return createClient(
    supabaseUrl.trim(),
    publishableKey.trim(),
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}