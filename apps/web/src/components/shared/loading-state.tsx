import { LoaderCircle } from "lucide-react";

export function LoadingState({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white/50 p-6 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
