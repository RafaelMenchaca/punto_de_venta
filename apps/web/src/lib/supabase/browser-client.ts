import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env/client";

let browserClient: SupabaseClient | null = null;

export const getBrowserSupabaseClient = () => {
  if (!clientEnv.supabaseUrl || !clientEnv.supabaseAnonKey) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(
    clientEnv.supabaseUrl,
    clientEnv.supabaseAnonKey,
  );
  return browserClient;
};
