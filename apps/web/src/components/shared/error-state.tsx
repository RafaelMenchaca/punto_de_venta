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
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <div className="space-y-3">
          <p>{message}</p>
          {actionLabel && onAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
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
