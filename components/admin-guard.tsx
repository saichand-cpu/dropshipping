"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!supabase) {
        if (active) setChecking(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error || profile?.role !== "admin") {
        window.location.href = "/account";
        return;
      }

      if (active) {
        setAllowed(true);
        setChecking(false);
      }
    }

    checkAdmin();
    return () => { active = false; };
  }, []);

  if (checking) {
    return <main className="container-shop flex min-h-[60vh] items-center justify-center"><p className="text-sm text-neutral-500">Checking admin access…</p></main>;
  }

  if (!allowed) return null;
  return <>{children}</>;
}
