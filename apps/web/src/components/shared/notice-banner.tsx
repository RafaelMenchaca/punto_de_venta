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
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4" />
        <div className="space-y-3">
          <p>{message}</p>
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
