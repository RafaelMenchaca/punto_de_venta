"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryLocationOption } from "@/features/inventory/types";
import type {
  CreateGoodsReceiptPayload,
  PurchaseOrderDetail,
} from "@/features/purchasing/types";
import {
  derivePendingQuantity,
  roundCurrency,
  roundQuantity,
} from "@/features/purchasing/utils";
import { formatCurrency } from "@/lib/utils";

interface ReceiptLineFormValue {
  id: string;
  purchase_order_item_id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: string;
  unit_cost: string;
  pending_quantity: number;
}

const orderToLines = (
  order: PurchaseOrderDetail | null,
): ReceiptLineFormValue[] =>
  order?.items
    .filter((item) => derivePendingQuantity(item) > 0)
    .map((item) => ({
      id: item.id,
      purchase_order_item_id: item.id,
      product_id: item.productId,
      product_name: item.productName,
      sku: item.sku,
      quantity: String(derivePendingQuantity(item)),
      unit_cost: String(item.unitCost),
      pending_quantity: derivePendingQuantity(item),
    })) ?? [];

export function GoodsReceiptForm({
  businessId,
  branchId,
  order,
  locations,
  loading,
  readOnly = false,
  onSubmit,
}: {
  businessId: string;
  branchId: string;
  order: PurchaseOrderDetail | null;
  locations: InventoryLocationOption[];
  loading: boolean;
  readOnly?: boolean;
  onSubmit: (payload: CreateGoodsReceiptPayload) => Promise<void>;
}) {
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<ReceiptLineFormValue[]>(() =>
    orderToLines(order),
  );
  const defaultLocationId = useMemo(
    () =>
      locations.find((location) => location.isDefault)?.id ??
      locations[0]?.id ??
      "",
    [locations],
  );
  const selectedLocationId = locationId || defaultLocationId;

  const totals = useMemo(
    () =>
      lines.reduce(
        (accumulator, line) => {
          const quantity = Number(line.quantity);
          const unitCost = Number(line.unit_cost);
          const lineSubtotal =
            Number.isFinite(quantity) && Number.isFinite(unitCost)
              ? roundCurrency(quantity * unitCost)
              : 0;

          accumulator.quantity = roundQuantity(
            accumulator.quantity + (Number.isFinite(quantity) ? quantity : 0),
          );
          accumulator.total = roundCurrency(accumulator.total + lineSubtotal);
          return accumulator;
        },
        {
          quantity: 0,
          total: 0,
        },
      ),
    [lines],
  );

  const isInvalid =
    readOnly ||
    !order ||
    !selectedLocationId ||
    lines.length === 0 ||
    lines.some((line) => {
      const quantity = Number(line.quantity);
      const unitCost = Number(line.unit_cost);

      return (
        Number.isNaN(quantity) ||
        quantity <= 0 ||
        quantity > line.pending_quantity ||
        Number.isNaN(unitCost) ||
        unitCost < 0
      );
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recepcion de mercancia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!order ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
            Selecciona una orden para ver cantidades pendientes y registrar la
            recepcion.
          </div>
        ) : (
          <>
            {readOnly ? (
              <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
                Tu rol solo puede consultar recepciones. No puedes registrar una
                nueva recepcion.
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white/60 p-4">
                <p className="text-sm text-muted-foreground">Orden</p>
                <p className="mt-2 font-semibold">{order.folio}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.supplier?.name ?? "Sin proveedor"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-location">Ubicacion</Label>
                <select
                  id="receipt-location"
                  className="ui-select"
                  value={selectedLocationId}
                  disabled={readOnly}
                  onChange={(event) => setLocationId(event.target.value)}
                >
                  <option value="">Selecciona una ubicacion</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                      {location.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.35rem] bg-muted/70 p-4 text-sm md:grid-cols-3">
              <Metric
                label="Lineas pendientes"
                value={String(lines.length)}
              />
              <Metric
                label="Cantidad prevista"
                value={String(totals.quantity)}
              />
              <Metric
                label="Valor estimado"
                value={formatCurrency(totals.total)}
              />
            </div>

            <div className="space-y-3">
              {lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
                  Esta orden ya no tiene cantidades pendientes por recibir.
                </div>
              ) : null}

              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 xl:grid-cols-[1.2fr_0.55fr_0.55fr_auto]"
                >
                  <div>
                    <p className="font-medium">{line.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {line.sku ?? "sin SKU"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pendiente: {line.pending_quantity}
                    </p>
                  </div>

                  <Field label="Cantidad" htmlFor={`receipt-qty-${line.id}`}>
                    <Input
                      id={`receipt-qty-${line.id}`}
                      type="number"
                      min="0.001"
                      step="0.001"
                      max={line.pending_quantity}
                      value={line.quantity}
                      disabled={readOnly}
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

                  <Field label="Costo" htmlFor={`receipt-cost-${line.id}`}>
                    <Input
                      id={`receipt-cost-${line.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unit_cost}
                      disabled={readOnly}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((currentLine) =>
                            currentLine.id === line.id
                              ? {
                                  ...currentLine,
                                  unit_cost: event.target.value,
                                }
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
                      disabled={readOnly}
                      onClick={() =>
                        setLines((current) =>
                          current.filter(
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

            <div className="space-y-2">
              <Label htmlFor="receipt-notes">Notas</Label>
              <Textarea
                id="receipt-notes"
                value={notes}
                disabled={readOnly}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones de la recepcion"
              />
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={loading || isInvalid}
            onClick={async () => {
              if (readOnly) {
                return;
              }

              if (!order) {
                return;
              }

              await onSubmit({
                business_id: businessId,
                branch_id: branchId,
                purchase_order_id: order.id,
                location_id: selectedLocationId,
                notes: notes.trim() || undefined,
                items: lines.map((line) => ({
                  purchase_order_item_id: line.purchase_order_item_id,
                  product_id: line.product_id,
                  quantity: Number(line.quantity),
                  unit_cost:
                    line.unit_cost.trim().length > 0
                      ? Number(line.unit_cost)
                      : undefined,
                })),
              });

              setNotes("");
            }}
          >
            {loading ? "Guardando..." : "Registrar recepcion"}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
