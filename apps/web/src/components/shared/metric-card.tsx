import { cn } from "@/lib/utils";

type MetricTone = "neutral" | "positive" | "warning" | "negative";

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
  emphasized = false,
  className,
}: {
  label: string;
  value: string;
  helper?: string | null;
  tone?: MetricTone;
  emphasized?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-white/70 bg-white/82 p-4 shadow-[0_14px_28px_rgba(23,23,23,0.05)] backdrop-blur-sm",
        tone === "positive" && "bg-emerald-50/90",
        tone === "warning" && "bg-amber-50/90",
        tone === "negative" && "bg-rose-50/90",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-semibold tracking-tight",
          emphasized ? "text-[1.7rem]" : "text-lg",
          tone === "positive" && "text-emerald-700",
          tone === "warning" && "text-amber-800",
          tone === "negative" && "text-rose-700",
        )}
      >
        {value}
      </p>
      {helper ? (
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
