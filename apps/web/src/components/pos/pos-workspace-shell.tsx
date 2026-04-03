import {
  CircleDot,
  History,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PosWorkspaceShell({
  title,
  statusLabel,
  statusVariant,
  metaLabel,
  sessionLabel,
  lastSaleLabel,
  onShowSale,
  onShowHistory,
  onShowRefunds,
  onMinimize,
  actions,
  main,
  aside,
}: {
  title: string;
  statusLabel: string;
  statusVariant: "default" | "warning" | "success";
  metaLabel: string;
  sessionLabel: string;
  lastSaleLabel?: string | null;
  onShowSale: () => void;
  onShowHistory: () => void;
  onShowRefunds: () => void;
  onMinimize: () => void;
  actions?: ReactNode;
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.14),transparent_24%),rgba(237,231,220,0.96)] backdrop-blur-[2px]">
      <div className="flex h-full flex-col p-3 md:p-4">
        <section className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-black/8 bg-[linear-gradient(180deg,#fbf8f2,#f4eee4)] shadow-[0_36px_120px_rgba(23,23,23,0.24)]">
          <header className="flex shrink-0 items-center gap-3 border-b border-black/6 px-4 py-3 md:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-semibold tracking-tight md:text-base">
                    {title}
                  </p>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {metaLabel} | {sessionLabel}
                  {lastSaleLabel ? ` | ${lastSaleLabel}` : ""}
                </p>
              </div>
            </div>

            <nav className="ml-auto hidden items-center gap-1 lg:flex">
              <WorkspaceNavButton
                label="Venta"
                icon={<CircleDot className="h-4 w-4" />}
                active
                onClick={onShowSale}
              />
              <WorkspaceNavButton
                label="Historial"
                icon={<History className="h-4 w-4" />}
                onClick={onShowHistory}
              />
              <WorkspaceNavButton
                label="Devoluciones"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={onShowRefunds}
              />
            </nav>

            <div className="flex items-center gap-2">
              {actions}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-black/10 bg-white/85 lg:hidden"
                onClick={onShowHistory}
              >
                <History className="h-4 w-4" />
                Historial
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="hidden border-black/10 bg-white/85 md:inline-flex lg:hidden"
                onClick={onShowRefunds}
              >
                <RotateCcw className="h-4 w-4" />
                Devoluciones
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-black/10 bg-white/85"
                onClick={onMinimize}
              >
                <Minimize2 className="h-4 w-4" />
                <span className="hidden md:inline">Minimizar</span>
              </Button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-4 p-3 md:p-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-h-0 min-w-0">{main}</div>
            <aside className="min-h-0 min-w-0">{aside}</aside>
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkspaceNavButton({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
        active
          ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(15,118,110,0.22)]"
          : "bg-white/72 text-foreground hover:bg-white",
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
