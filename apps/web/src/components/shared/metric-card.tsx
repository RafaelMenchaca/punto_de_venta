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
        "rounded-[1rem] border border-white/70 bg-white/82 p-2.5 shadow-[0_12px_22px_rgba(23,23,23,0.05)] backdrop-blur-sm md:p-3",
        tone === "positive" && "bg-emerald-50/90",
        tone === "warning" && "bg-amber-50/90",
        tone === "negative" && "bg-rose-50/90",
        className,
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-semibold tracking-tight",
          emphasized ? "text-[1.2rem] md:text-[1.35rem]" : "text-[15px] md:text-base",
          tone === "positive" && "text-emerald-700",
          tone === "warning" && "text-amber-800",
          tone === "negative" && "text-rose-700",
        )}
      >
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground md:text-xs">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
