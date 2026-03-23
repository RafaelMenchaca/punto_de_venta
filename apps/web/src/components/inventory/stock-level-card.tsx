import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StockLevelCard({
  product_name,
  quantity,
  location_name,
}: {
  product_name: string;
  quantity: number;
  location_name?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock actual</CardTitle>
        <CardDescription>
          Nivel disponible para el producto seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Producto
          </p>
          <p className="mt-2 font-medium">{product_name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Cantidad
          </p>
          <p className="mt-2 text-2xl font-semibold">{quantity}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Ubicación
          </p>
          <p className="mt-2 font-medium">{location_name ?? "Sin nombre"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
