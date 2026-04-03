import { Search } from "lucide-react";

export function PosEmptySaleState() {
  return (
    <div className="flex min-h-[240px] flex-1 items-center justify-center px-6 py-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">
          Aun no hay articulos en la venta.
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Captura por nombre, SKU o codigo de barras para empezar a vender.
        </p>
      </div>
    </div>
  );
}
