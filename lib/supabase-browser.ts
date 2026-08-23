import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Supabase browser environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl.trim(),
    publishableKey.trim()
  );
}