"use client";

import { useEffect, useState } from "react";
import { clientEnv } from "@/lib/env/client";
import { useSupabaseClient } from "@/providers/supabase-provider";

export function useCurrentUser() {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<{
    id: string | null;
    email: string | null;
    source: "supabase" | "dev";
  }>({
    id: clientEnv.devUserId || null,
    email: null,
    source: "dev",
  });

  useEffect(() => {
    let active = true;

    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) {
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
        source: "supabase",
      });
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  return user;
}
