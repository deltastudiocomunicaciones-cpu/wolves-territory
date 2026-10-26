"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExpansionDashboard from "@/components/admin/ExpansionDashboard";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AuthorizedAdmin = {
  full_name: string;
  role: "SUPER_ADMIN";
};

export default function ExpansionPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AuthorizedAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      try {
        const supabase = getSupabaseBrowser();

        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("admin_users")
          .select("full_name, role, active")
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile ||
          profile.active !== true ||
          profile.role !== "SUPER_ADMIN"
        ) {
          router.replace("/admin");
          return;
        }

        if (!cancelled) {
          setAdmin({
            full_name: profile.full_name,
            role: "SUPER_ADMIN",
          });
        }
      } catch (error) {
        console.error("EXPANSION ACCESS ERROR:", error);
        router.replace("/admin/login");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#171717] text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Verificando acceso a Expansion...
        </p>
      </main>
    );
  }

  if (!admin) {
    return null;
  }

  return <ExpansionDashboard fullName={admin.full_name} />;
}
