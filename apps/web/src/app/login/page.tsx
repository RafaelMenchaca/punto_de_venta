"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState message="Preparando login..." />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { signIn, source, status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectTo);
    }
  }, [redirectTo, router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Ingresa email y password.");
      return;
    }

    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      toast.success("Sesion iniciada correctamente.");
      router.replace(redirectTo);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesion.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/80 shadow-[0_24px_64px_rgba(23,23,23,0.12)] backdrop-blur">
        <CardHeader>
          <CardTitle>Iniciar sesion</CardTitle>
          <CardDescription>
            Accede con tu cuenta real de Supabase para usar caja, POS e
            inventario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {source === "dev" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              El bypass de desarrollo esta activo. Si quieres probar auth real,
              desactiva `NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS`.
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@negocio.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu password"
              />
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "Ingresando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
