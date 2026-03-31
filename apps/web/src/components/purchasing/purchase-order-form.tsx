"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProductSearch } from "@/features/products/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import type {
  CreatePurchaseOrderPayload,
  PurchaseOrderDetail,
  PurchaseOrderLineInput,
  PurchasingSupplier,
  UpdatePurchaseOrderPayload,
} from "@/features/purchasing/types";
import {
  calculatePurchaseOrderTotals,
  roundQuantity,
} from "@/features/purchasing/utils";
import { formatCurrency } from "@/lib/utils";

type PurchaseOrderPayload =
  | CreatePurchaseOrderPayload
  | UpdatePurchaseOrderPayload;

const createEmptyLine = (): PurchaseOrderLineInput => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  product_id: "",
  product_name: "",
  sku: null,
  quantity: "1",
  unit_cost: "",
  tax_rate: "0",
});

const detailToLines = (detail: PurchaseOrderDetail | null | undefined) =>
  detail?.items.map((item) => ({
    id: item.id,
    product_id: item.productId,
    product_name: item.productName,
    sku: item.sku,
    quantity: String(item.quantity),
    unit_cost: String(item.unitCost),
    tax_rate: String(item.taxRate),
  })) ?? [createEmptyLine()];

export function PurchaseOrderForm({
  businessId,
  branchId,
  suppliers,
  loading,
  mode = "create",
  initialOrder,
  highlight = false,
  onCancelEdit,
  onSubmit,
}: {
  businessId: string;
  branchId: string;
  suppliers: PurchasingSupplier[];
  loading: boolean;
  mode?: "create" | "edit";
  initialOrder?: PurchaseOrderDetail | null;
  highlight?: boolean;
  onCancelEdit?: () => void;
  onSubmit: (payload: PurchaseOrderPayload) => Promise<void>;
}) {
  const [supplierId, setSupplierId] = useState(
    initialOrder?.supplier?.id ?? "",
  );
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");
  const [lines, setLines] = useState<PurchaseOrderLineInput[]>(
    detailToLines(initialOrder),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const isEditMode = mode === "edit";
  const searchQuery = useProductSearch(businessId, branchId, searchTerm, 2);
  const totals = useMemo(() => calculatePurchaseOrderTotals(lines), [lines]);

  const isInvalid = useMemo(() => {
    return (
      supplierId.trim().length === 0 ||
      lines.length === 0 ||
      lines.some((line) => {
        const quantityText = line.quantity.trim();
        const unitCostText = line.unit_cost.trim();
        const quantity = Number(line.quantity);
        const unitCost = Number(line.unit_cost);
        const taxRate = Number(line.tax_rate);

        return (
          quantityText.length === 0 ||
          Number.isNaN(quantity) ||
          quantity <= 0 ||
          unitCostText.length === 0 ||
          Number.isNaN(unitCost) ||
          unitCost < 0 ||
          Number.isNaN(taxRate) ||
          taxRate < 0 ||
          line.product_id.trim().length === 0
        );
      })
    );
  }, [lines, supplierId]);

  const addProduct = (product: ProductSearchResult) => {
    setLines((current) => {
      const existingLine = current.find(
        (line) => line.product_id === product.id,
      );

      if (existingLine) {
        return current.map((line) =>
          line.product_id === product.id
          ? {
              ...line,
              quantity: String(roundQuantity(Number(line.quantity) + 1)),
              }
            : line,
        );
      }

      return [
        ...current,
        {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          quantity: "1",
          unit_cost: "",
          tax_rate: String(product.taxRate ?? 0),
        },
      ];
    });
    setSearchTerm("");
  };

  const title = isEditMode
    ? `Editando orden: ${initialOrder?.folio ?? ""}`
    : "Nueva orden de compra";

  const description = isEditMode
    ? "Edita solo borradores o estados seguros. La orden debe quedar clara antes de recibir mercancia."
    : "Crea un borrador simple para luego recepcionar mercancia parcial o total.";

  return (
    <Card
      className={
        highlight
          ? "border-primary/40 bg-primary/5 shadow-[0_0_0_4px_rgba(15,118,110,0.12)] transition-all"
          : undefined
      }
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purchase-order-supplier">Proveedor</Label>
            <select
              id="purchase-order-supplier"
              className="ui-select"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Selecciona un proveedor</option>
              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                  disabled={!supplier.isActive}
                >
                  {supplier.name}
                  {supplier.isActive ? "" : " (Inactivo)"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-order-notes">Notas</Label>
            <Textarea
              id="purchase-order-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones de la orden"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="purchase-order-search">Agregar producto</Label>
              <Input
                id="purchase-order-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Busca por nombre, SKU o barcode"
              />
            </div>
          </div>

          {searchTerm.trim().length >= 2 && searchQuery.data?.length ? (
            <div className="space-y-2 rounded-2xl border border-border bg-white/60 p-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Resultados
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery.data.length} producto
                  {searchQuery.data.length === 1 ? "" : "s"}
                </p>
              </div>
              {searchQuery.data.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left hover:border-border hover:bg-white"
                  onClick={() => addProduct(product)}
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku ?? "sin SKU"} | Barcode:{" "}
                      {product.barcode ?? "sin barcode"}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.categoryName ?? "Sin categoria"}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {lines.map((line) => (
              <div
                key={line.id}
                className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 xl:grid-cols-[1.25fr_0.55fr_0.55fr_0.55fr_auto]"
              >
                <div>
                  <p className="font-medium">{line.product_name || "Linea"}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {line.sku ?? "sin SKU"}
                  </p>
                </div>

                <Field label="Cantidad" htmlFor={`po-qty-${line.id}`}>
                  <Input
                    id={`po-qty-${line.id}`}
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((currentLine) =>
                          currentLine.id === line.id
                            ? { ...currentLine, quantity: event.target.value }
                            : currentLine,
                        ),
                      )
                    }
                  />
                </Field>

                <Field label="Costo unitario" htmlFor={`po-cost-${line.id}`}>
                  <Input
                    id={`po-cost-${line.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_cost}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((currentLine) =>
                          currentLine.id === line.id
                            ? { ...currentLine, unit_cost: event.target.value }
                            : currentLine,
                        ),
                      )
                    }
                  />
                </Field>

                <Field label="Tasa %" htmlFor={`po-tax-${line.id}`}>
                  <Input
                    id={`po-tax-${line.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.tax_rate}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((currentLine) =>
                          currentLine.id === line.id
                            ? { ...currentLine, tax_rate: event.target.value }
                            : currentLine,
                        ),
                      )
                    }
                  />
                </Field>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setLines((current) =>
                        current.length <= 1
                          ? current
                          : current.filter(
                              (currentLine) => currentLine.id !== line.id,
                            ),
                      )
                    }
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-muted/70 p-4 text-sm md:grid-cols-3">
          <Metric label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <Metric label="Impuestos" value={formatCurrency(totals.taxTotal)} />
          <Metric label="Total" value={formatCurrency(totals.total)} emphasized />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isEditMode ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onCancelEdit}
            >
              Cancelar edicion
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setSupplierId("");
                setNotes("");
                setLines([createEmptyLine()]);
                setSearchTerm("");
              }}
            >
              Limpiar formulario
            </Button>
          )}

          <Button
            type="button"
            disabled={loading || isInvalid}
            onClick={async () => {
              const payload = {
                business_id: businessId,
                branch_id: branchId,
                supplier_id: supplierId,
                notes: notes.trim() || undefined,
                items: lines.map((line) => ({
                  product_id: line.product_id,
                  quantity: Number(line.quantity),
                  unit_cost: Number(line.unit_cost),
                  tax_rate: Number(line.tax_rate),
                })),
              };

              await onSubmit(payload);

              if (!isEditMode) {
                setSupplierId("");
                setNotes("");
                setLines([createEmptyLine()]);
                setSearchTerm("");
              }
            }}
          >
            {loading
              ? isEditMode
                ? "Actualizando..."
                : "Guardando..."
              : isEditMode
                ? "Actualizar orden"
                : "Guardar borrador"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 ${emphasized ? "text-base font-semibold" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
