"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { useAuth } from "@/providers/auth-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const redirectTo = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirectTo=${redirectTo}`);
    }
  }, [pathname, router, status]);

  if (status === "loading") {
    return <LoadingState message="Verificando sesion..." />;
  }

  if (status === "unauthenticated") {
    return <LoadingState message="Redirigiendo al login..." />;
  }

  return <>{children}</>;
}
