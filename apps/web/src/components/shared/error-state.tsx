import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/92 p-5 text-sm text-rose-700 shadow-[0_14px_26px_rgba(190,24,93,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-3">
          <p className="leading-6">{message}</p>
          {actionLabel && onAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100 hover:text-rose-800"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
