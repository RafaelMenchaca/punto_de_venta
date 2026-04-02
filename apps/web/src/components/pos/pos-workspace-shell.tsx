import {
  Maximize2,
  Minimize2,
  Store,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PosWorkspaceShell({
  view,
  statusLabel,
  statusVariant,
  saleTotal,
  lineCount,
  customerLabel,
  cashierLabel,
  registerLabel,
  branchLabel,
  sessionLabel,
  onToggleView,
  actions,
  tabs,
  main,
  aside,
}: {
  view: "expanded" | "compact";
  statusLabel: string;
  statusVariant: "default" | "warning" | "success";
  saleTotal: string;
  lineCount: number;
  customerLabel: string;
  cashierLabel: string;
  registerLabel: string;
  branchLabel: string;
  sessionLabel: string;
  onToggleView: () => void;
  actions?: ReactNode;
  tabs?: ReactNode;
  main: ReactNode;
  aside: ReactNode;
}) {
  const expanded = view === "expanded";

  return (
    <section
      className={cn(
        "relative rounded-[2.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(15,118,110,0.08),rgba(255,255,255,0.5)_22%,rgba(246,242,235,0.92)_100%)] p-3 shadow-[0_30px_70px_rgba(23,23,23,0.12)] transition-all duration-300",
        expanded && "min-h-[calc(100vh-10rem)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.14),transparent_30%)]" />

      <div className="relative flex h-full flex-col rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,242,235,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:p-5 xl:p-6">
        <header className="space-y-5 border-b border-black/5 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <WindowDots />
                <Badge>Workspace POS</Badge>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Operacion de caja
                </p>
                <h1 className="text-2xl font-semibold tracking-tight md:text-[2.15rem]">
                  Venta actual enfocada en cobro
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  El area principal queda reservada para capturar y revisar la
                  venta. El panel lateral acompana con total, resumen y cobro
                  sin quitar protagonismo a las lineas activas.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <Button
                type="button"
                variant="outline"
                className="border-white/70 bg-white/82"
                onClick={onToggleView}
              >
                {expanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {expanded ? "Minimizar" : "Expandir"}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_360px]",
              !expanded && "xl:grid-cols-[minmax(0,1.3fr)_320px]",
            )}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <WorkspaceMetric
                label="Total actual"
                value={saleTotal}
                helper="Lectura inmediata para caja"
                emphasized
              />
              <WorkspaceMetric
                label="Lineas activas"
                value={String(lineCount)}
                helper={
                  lineCount > 0
                    ? "Productos capturados para revision"
                    : "Esperando captura de productos"
                }
              />
              <WorkspaceMetric
                label="Cliente"
                value={customerLabel}
                helper="Opcional y siempre secundario frente al cobro"
              />
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/70 bg-white/74 p-4 shadow-[0_14px_26px_rgba(23,23,23,0.05)] sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <InfoItem icon={UserRound} label="Cajero" value={cashierLabel} />
              <InfoItem icon={Store} label="Caja" value={registerLabel} />
              <InfoItem icon={Store} label="Sucursal" value={branchLabel} />
              <InfoItem icon={Wallet} label="Sesion" value={sessionLabel} />
            </div>
          </div>

          {tabs ? <div>{tabs}</div> : null}
        </header>

        <div
          className={cn(
            "grid flex-1 gap-5 pt-5 transition-all duration-300 2xl:grid-cols-[minmax(0,1.65fr)_420px]",
            !expanded && "2xl:grid-cols-[minmax(0,1.28fr)_360px]",
          )}
        >
          <div className="min-w-0 space-y-5">{main}</div>
          <aside className="min-w-0 space-y-5">{aside}</aside>
        </div>
      </div>
    </section>
  );
}

function WindowDots() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/74 px-3 py-2 shadow-[0_8px_18px_rgba(23,23,23,0.04)]">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
    </div>
  );
}

function WorkspaceMetric({
  label,
  value,
  helper,
  emphasized = false,
}: {
  label: string;
  value: string;
  helper: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/70 bg-white/78 p-4 shadow-[0_12px_24px_rgba(23,23,23,0.05)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-semibold tracking-tight",
          emphasized ? "text-2xl md:text-[1.85rem]" : "text-base md:text-lg",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.3rem] bg-muted/48 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/84 text-muted-foreground shadow-[0_6px_16px_rgba(23,23,23,0.04)]">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
