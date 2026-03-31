import { LoaderCircle } from "lucide-react";

export function LoadingState({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-36 items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border bg-white/56 p-7 text-sm text-muted-foreground">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/75">
        <LoaderCircle className="h-4 w-4 animate-spin" />
      </div>
      <span>{message}</span>
    </div>
  );
}
