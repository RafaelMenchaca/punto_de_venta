"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import {
  useCreateInventoryBrandMutation,
  useCreateInventoryCategoryMutation,
  useCreateInventorySupplierMutation,
  useCreateInventoryTaxRateMutation,
} from "@/features/inventory/hooks";
import type { InventoryCatalogs } from "@/features/inventory/types";

export function InventoryCatalogsPanel({
  business_id,
  branch_id,
  catalogs,
}: {
  business_id: string;
  branch_id: string;
  catalogs?: InventoryCatalogs | null;
}) {
  const categoryMutation = useCreateInventoryCategoryMutation(
    business_id,
    branch_id,
  );
  const brandMutation = useCreateInventoryBrandMutation(business_id, branch_id);
  const taxRateMutation = useCreateInventoryTaxRateMutation(
    business_id,
    branch_id,
  );
  const supplierMutation = useCreateInventorySupplierMutation(
    business_id,
    branch_id,
  );

  const [categoryName, setCategoryName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [taxRateName, setTaxRateName] = useState("");
  const [taxRateValue, setTaxRateValue] = useState("0");
  const [supplierName, setSupplierName] = useState("");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <CatalogCard
        title="Categorias"
        description="Agrupa articulos por linea o familia."
        items={catalogs?.categories.map((category) => category.name) ?? []}
        inputId="catalog-category"
        inputLabel="Nueva categoria"
        inputValue={categoryName}
        onInputChange={setCategoryName}
        loading={categoryMutation.isPending}
        onCreate={async () => {
          try {
            await categoryMutation.mutateAsync({
              business_id,
              name: categoryName.trim(),
            });
            setCategoryName("");
            toast.success("Categoria guardada.");
          } catch (error) {
            toast.error(
              getFriendlyErrorMessage(
                error,
                "No se pudo guardar la categoria.",
              ),
            );
          }
        }}
      />

      <CatalogCard
        title="Marcas"
        description="Mantiene marcas separadas del listado de articulos."
        items={catalogs?.brands.map((brand) => brand.name) ?? []}
        inputId="catalog-brand"
        inputLabel="Nueva marca"
        inputValue={brandName}
        onInputChange={setBrandName}
        loading={brandMutation.isPending}
        onCreate={async () => {
          try {
            await brandMutation.mutateAsync({
              business_id,
              name: brandName.trim(),
            });
            setBrandName("");
            toast.success("Marca guardada.");
          } catch (error) {
            toast.error(
              getFriendlyErrorMessage(error, "No se pudo guardar la marca."),
            );
          }
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tasas e impuestos</CardTitle>
          <CardDescription>
            Define tasas simples para reutilizarlas en articulos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {catalogs?.taxRates.length ? (
              catalogs.taxRates.map((taxRate) => (
                <div
                  key={taxRate.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-white/60 px-3 py-2 text-sm"
                >
                  <span>{taxRate.name}</span>
                  <span className="font-semibold">{taxRate.rate}%</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-white/50 px-3 py-3 text-sm text-muted-foreground">
                Aun no hay tasas registradas.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catalog-tax-rate-name">Nombre</Label>
              <Input
                id="catalog-tax-rate-name"
                value={taxRateName}
                onChange={(event) => setTaxRateName(event.target.value)}
                placeholder="IVA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-tax-rate-value">Porcentaje</Label>
              <Input
                id="catalog-tax-rate-value"
                type="number"
                min="0"
                step="0.01"
                value={taxRateValue}
                onChange={(event) => setTaxRateValue(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                taxRateMutation.isPending ||
                taxRateName.trim().length === 0 ||
                Number.isNaN(Number(taxRateValue)) ||
                Number(taxRateValue) < 0
              }
              onClick={async () => {
                try {
                  await taxRateMutation.mutateAsync({
                    business_id,
                    name: taxRateName.trim(),
                    rate: Number(taxRateValue),
                  });
                  setTaxRateName("");
                  setTaxRateValue("0");
                  toast.success("Tasa guardada.");
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      "No se pudo guardar la tasa.",
                    ),
                  );
                }
              }}
            >
              {taxRateMutation.isPending ? "Guardando..." : "Guardar tasa"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proveedores</CardTitle>
          <CardDescription>
            Catalogo basico para entradas y recepciones de mercancia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {catalogs?.suppliers.length ? (
              catalogs.suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="rounded-xl border border-border bg-white/60 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{supplier.name}</p>
                  {supplier.phone || supplier.email ? (
                    <p className="text-muted-foreground">
                      {[supplier.phone, supplier.email]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-white/50 px-3 py-3 text-sm text-muted-foreground">
                Aun no hay proveedores registrados.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalog-supplier">Nuevo proveedor</Label>
            <Input
              id="catalog-supplier"
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="Proveedor principal"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                supplierMutation.isPending || supplierName.trim().length === 0
              }
              onClick={async () => {
                try {
                  await supplierMutation.mutateAsync({
                    business_id,
                    name: supplierName.trim(),
                  });
                  setSupplierName("");
                  toast.success("Proveedor guardado.");
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      "No se pudo guardar el proveedor.",
                    ),
                  );
                }
              }}
            >
              {supplierMutation.isPending
                ? "Guardando..."
                : "Guardar proveedor"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CatalogCard({
  title,
  description,
  items,
  inputId,
  inputLabel,
  inputValue,
  onInputChange,
  loading,
  onCreate,
}: {
  title: string;
  description: string;
  items: string[];
  inputId: string;
  inputLabel: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  loading: boolean;
  onCreate: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.length ? (
            items.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-border bg-white/60 px-3 py-2 text-sm"
              >
                {item}
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-white/50 px-3 py-3 text-sm text-muted-foreground">
              Aun no hay elementos registrados.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={inputId}>{inputLabel}</Label>
          <Input
            id={inputId}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={loading || inputValue.trim().length === 0}
            onClick={() => void onCreate()}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
