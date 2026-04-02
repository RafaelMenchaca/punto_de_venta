import {
  PackageSearch,
  ReceiptText,
  Search,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PosEmptySaleState() {
  return (
    <div className="rounded-[1.85rem] border border-dashed border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,228,214,0.44))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-primary/12 text-primary shadow-[0_10px_24px_rgba(15,118,110,0.12)]">
          <PackageSearch className="h-6 w-6" />
        </div>

        <div className="space-y-3">
          <Badge>Venta vacia</Badge>
          <div>
            <h3 className="text-xl font-semibold tracking-tight md:text-[1.7rem]">
              El buscador es el punto de arranque de la venta.
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Cuando agregues productos, aqui veras las lineas activas con sus
              cantidades, descuentos y netos listos para revisar antes del
              cobro.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StepCard
          icon={Search}
          title="1. Busca"
          description="Ubica el producto por nombre, SKU o codigo de barras."
        />
        <StepCard
          icon={ReceiptText}
          title="2. Revisa"
          description="Ajusta cantidades o descuentos por linea desde esta misma zona."
        />
        <StepCard
          icon={Wallet}
          title="3. Cobra"
          description="Cuando haya productos, el panel derecho quedara listo para cerrar la venta."
        />
      </div>
    </div>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/80 bg-white/78 p-4 shadow-[0_10px_24px_rgba(23,23,23,0.05)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-sm font-semibold tracking-tight">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
