import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoticeBanner({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/92 p-5 text-sm text-amber-900 shadow-[0_14px_26px_rgba(217,119,6,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="space-y-3">
          <p className="leading-6">{message}</p>
          {actionLabel && onAction ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-200 bg-white text-amber-900 hover:bg-amber-100"
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
