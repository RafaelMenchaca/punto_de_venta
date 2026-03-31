import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ModuleHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_20px_52px_rgba(23,23,23,0.08)] backdrop-blur-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_30%)]" />
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-[2rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
              {description}
            </p>
          </div>

          {actions ? <div className="relative shrink-0">{actions}</div> : null}
        </div>

        {children ? (
          <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
