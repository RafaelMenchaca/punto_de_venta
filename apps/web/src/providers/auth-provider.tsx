"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env/client";
import { useSupabaseClient } from "./supabase-provider";

type AuthSource = "supabase" | "dev" | null;
type AuthStatus = "loading" | "authenticated" | "unauthenticated";
const AUTH_BOOT_TIMEOUT_MS = 2500;

interface AuthContextValue {
  session: Session | null;
  status: AuthStatus;
  source: AuthSource;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const buildDevAuthState = (): Pick<
  AuthContextValue,
  "session" | "status" | "source" | "user"
> => {
  if (!clientEnv.enableDevAuthBypass || !clientEnv.devUserId) {
    return {
      session: null,
      status: "unauthenticated",
      source: null,
      user: null,
    };
  }

  return {
    session: null,
    status: "authenticated",
    source: "dev",
    user: {
      id: clientEnv.devUserId,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date(0).toISOString(),
    } as User,
  };
};

const buildAuthenticatedState = (
  session: Session,
): Pick<AuthContextValue, "session" | "status" | "source" | "user"> => ({
  session,
  status: "authenticated",
  source: "supabase",
  user: session.user,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabaseClient();
  const [state, setState] = useState<
    Pick<AuthContextValue, "session" | "status" | "source" | "user">
  >(() =>
    supabase
      ? {
          session: null,
          status: "loading",
          source: null,
          user: null,
        }
      : buildDevAuthState(),
  );

  useEffect(() => {
    let active = true;
    let bootResolved = false;

    if (!supabase) {
      return;
    }

    const bootTimeoutId = window.setTimeout(() => {
      if (!active || bootResolved) {
        return;
      }

      setState(buildDevAuthState());
    }, AUTH_BOOT_TIMEOUT_MS);

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        bootResolved = true;
        window.clearTimeout(bootTimeoutId);

        if (data.session?.user) {
          setState(buildAuthenticatedState(data.session));
          return;
        }

        setState(buildDevAuthState());
      })
      .catch(() => {
        if (!active) {
          return;
        }

        bootResolved = true;
        window.clearTimeout(bootTimeoutId);
        setState(buildDevAuthState());
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      bootResolved = true;
      window.clearTimeout(bootTimeoutId);

      if (session?.user) {
        setState(buildAuthenticatedState(session));
        return;
      }

      setState(buildDevAuthState());
    });

    return () => {
      active = false;
      window.clearTimeout(bootTimeoutId);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: async (email: string, password: string) => {
        if (!supabase) {
          throw new Error(
            "Supabase no esta configurado en el frontend para iniciar sesion.",
          );
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      signOut: async () => {
        if (supabase && state.source === "supabase") {
          const { error } = await supabase.auth.signOut();

          if (error) {
            throw new Error(error.message);
          }

          return;
        }

        throw new Error(
          "El bypass de desarrollo esta activo. Desactiva NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS para usar logout real.",
        );
      },
    }),
    [state, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
