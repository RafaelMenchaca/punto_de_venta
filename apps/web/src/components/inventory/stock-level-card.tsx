import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductStock } from "@/features/inventory/types";
import { formatInventoryQuantity } from "@/features/inventory/presentation";

export function StockLevelCard({ stock }: { stock: ProductStock }) {
  const totalQuantity = stock.total_quantity ?? stock.quantity;
  const reservedQuantity =
    stock.total_reserved_quantity ?? stock.reserved_quantity;
  const availableQuantity =
    stock.total_available_quantity ?? stock.available_quantity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock actual</CardTitle>
        <CardDescription>
          Stock total y desglose por ubicacion del producto seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Producto"
            value={stock.product_name}
            emphasized={false}
          />
          <Metric
            label="Total"
            value={`${formatInventoryQuantity(totalQuantity)} uds`}
          />
          <Metric
            label="Reservado"
            value={`${formatInventoryQuantity(reservedQuantity)} uds`}
          />
          <Metric
            label="Disponible"
            value={`${formatInventoryQuantity(availableQuantity)} uds`}
          />
        </div>

        {stock.default_location_name ? (
          <div className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">
            Ubicacion default:{" "}
            <span className="font-semibold text-foreground">
              {stock.default_location_name}
            </span>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Por ubicacion
          </p>
          {stock.locations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
              No hay balances registrados por ubicacion para este articulo.
            </div>
          ) : (
            stock.locations.map((location) => (
              <div
                key={location.locationId}
                className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 md:grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr]"
              >
                <div>
                  <p className="font-medium">
                    {location.locationName}
                    {location.isDefault ? " (Default)" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Codigo: {location.locationCode}
                    {location.isActive ? "" : " | Inactiva"}
                  </p>
                </div>
                <Metric
                  label="Cantidad"
                  value={`${formatInventoryQuantity(location.quantity)} uds`}
                  emphasized={false}
                />
                <Metric
                  label="Reservado"
                  value={`${formatInventoryQuantity(location.reservedQuantity)} uds`}
                  emphasized={false}
                />
                <Metric
                  label="Disponible"
                  value={`${formatInventoryQuantity(location.availableQuantity)} uds`}
                  emphasized={false}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  emphasized = true,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 ${emphasized ? "text-xl font-semibold" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
