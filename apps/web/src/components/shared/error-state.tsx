import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <p>{message}</p>
      </div>
    </div>
  );
}
