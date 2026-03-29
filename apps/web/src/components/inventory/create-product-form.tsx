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
import type {
  CreateInventoryProductPayload,
  InventoryCatalogs,
  InventoryProductDetail,
  UpdateInventoryProductPayload,
} from "@/features/inventory/types";

type ProductFormPayload =
  | CreateInventoryProductPayload
  | UpdateInventoryProductPayload;

const emptyValues = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  brand_id: "",
  tax_rate_id: "",
  sale_price: "0",
  cost_price: "0",
  min_stock: "0",
  barcode: "",
  additional_barcodes: "",
  primary_image_url: "",
  initial_stock: "0",
  location_id: "",
  track_inventory: true,
};

const detailToFormValues = (
  detail: InventoryProductDetail | null | undefined,
) => ({
  name: detail?.name ?? "",
  sku: detail?.sku ?? "",
  description: detail?.description ?? "",
  category_id: detail?.categoryId ?? "",
  brand_id: detail?.brandId ?? "",
  tax_rate_id: detail?.taxRateId ?? "",
  sale_price: String(detail?.salePrice ?? 0),
  cost_price: String(detail?.costPrice ?? 0),
  min_stock: String(detail?.minStock ?? 0),
  barcode: detail?.primaryBarcode ?? "",
  additional_barcodes: detail?.additionalBarcodes.join("\n") ?? "",
  primary_image_url: detail?.primaryImageUrl ?? "",
  initial_stock: "0",
  location_id: "",
  track_inventory: detail?.trackInventory ?? true,
});

export function CreateProductForm({
  business_id,
  branch_id,
  catalogs,
  loading,
  mode = "create",
  initialProduct,
  highlight = false,
  onCancelEdit,
  onSubmit,
}: {
  business_id: string;
  branch_id: string;
  catalogs?: InventoryCatalogs | null;
  loading: boolean;
  mode?: "create" | "edit";
  initialProduct?: InventoryProductDetail | null;
  highlight?: boolean;
  onCancelEdit?: () => void;
  onSubmit: (payload: ProductFormPayload) => Promise<void>;
}) {
  const [values, setValues] = useState(() =>
    mode === "edit" ? detailToFormValues(initialProduct) : emptyValues,
  );

  const isEditMode = mode === "edit";

  const numericValues = useMemo(
    () => ({
      sale_price: Number(values.sale_price),
      cost_price: Number(values.cost_price),
      min_stock: Number(values.min_stock),
      initial_stock: Number(values.initial_stock),
    }),
    [values],
  );

  const isInvalid = useMemo(() => {
    const hasInvalidNumbers =
      Number.isNaN(numericValues.sale_price) ||
      Number.isNaN(numericValues.cost_price) ||
      Number.isNaN(numericValues.min_stock) ||
      (!isEditMode && Number.isNaN(numericValues.initial_stock));

    return (
      values.name.trim().length === 0 ||
      values.sku.trim().length === 0 ||
      hasInvalidNumbers ||
      numericValues.sale_price < 0 ||
      numericValues.cost_price < 0 ||
      numericValues.min_stock < 0 ||
      (!isEditMode && numericValues.initial_stock < 0) ||
      (!isEditMode &&
        !values.track_inventory &&
        numericValues.initial_stock > 0)
    );
  }, [isEditMode, numericValues, values]);

  const title = isEditMode
    ? `Editando articulo: ${initialProduct?.name ?? ""}`
    : "Alta de articulo";
  const description = isEditMode
    ? "Actualiza la informacion del articulo seleccionado. El stock se administra desde Articulos y Entradas."
    : "Crea un articulo nuevo sin mezclarlo con la lista principal.";

  const resetCreateForm = () => {
    setValues(emptyValues);
  };

  const buildPayload = (): ProductFormPayload => {
    const additionalBarcodes = values.additional_barcodes
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);

    const basePayload = {
      business_id,
      branch_id,
      sku: values.sku.trim(),
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      category_id: values.category_id || undefined,
      brand_id: values.brand_id || undefined,
      tax_rate_id: values.tax_rate_id || undefined,
      sale_price: numericValues.sale_price,
      cost_price: numericValues.cost_price,
      min_stock: numericValues.min_stock,
      track_inventory: values.track_inventory,
      barcode: values.barcode.trim() || undefined,
      additional_barcodes: additionalBarcodes,
      primary_image_url: values.primary_image_url.trim() || undefined,
    };

    if (isEditMode) {
      return basePayload;
    }

    return {
      ...basePayload,
      initial_stock: numericValues.initial_stock,
      location_id: values.location_id || undefined,
    };
  };

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
          <Field label="Nombre" htmlFor="product-name">
            <Input
              id="product-name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ej. Coca Cola 600ml"
            />
          </Field>

          <Field label="SKU" htmlFor="product-sku">
            <Input
              id="product-sku"
              value={values.sku}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  sku: event.target.value,
                }))
              }
              placeholder="SKU-0002"
            />
          </Field>

          <Field label="Categoria" htmlFor="product-category">
            <select
              id="product-category"
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={values.category_id}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  category_id: event.target.value,
                }))
              }
            >
              <option value="">Sin categoria</option>
              {catalogs?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Marca" htmlFor="product-brand">
            <select
              id="product-brand"
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={values.brand_id}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  brand_id: event.target.value,
                }))
              }
            >
              <option value="">Sin marca</option>
              {catalogs?.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tasa / impuesto" htmlFor="product-tax-rate">
            <select
              id="product-tax-rate"
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={values.tax_rate_id}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  tax_rate_id: event.target.value,
                }))
              }
            >
              <option value="">Sin tasa</option>
              {catalogs?.taxRates.map((taxRate) => (
                <option key={taxRate.id} value={taxRate.id}>
                  {taxRate.name} ({taxRate.rate}%)
                </option>
              ))}
            </select>
          </Field>

          <Field label="Precio de venta" htmlFor="product-sale-price">
            <Input
              id="product-sale-price"
              type="number"
              min="0"
              step="0.01"
              value={values.sale_price}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  sale_price: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Costo unitario" htmlFor="product-cost-price">
            <Input
              id="product-cost-price"
              type="number"
              min="0"
              step="0.01"
              value={values.cost_price}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  cost_price: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Stock minimo" htmlFor="product-min-stock">
            <Input
              id="product-min-stock"
              type="number"
              min="0"
              step="0.001"
              value={values.min_stock}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  min_stock: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Barcode principal" htmlFor="product-barcode">
            <Input
              id="product-barcode"
              value={values.barcode}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  barcode: event.target.value,
                }))
              }
              placeholder="750100000002"
            />
          </Field>
        </div>

        <Field
          label="Barcodes adicionales"
          htmlFor="product-additional-barcodes"
        >
          <Textarea
            id="product-additional-barcodes"
            value={values.additional_barcodes}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                additional_barcodes: event.target.value,
              }))
            }
            placeholder="Uno por linea o separados por coma"
          />
        </Field>

        <Field label="URL de imagen principal" htmlFor="product-image-url">
          <Input
            id="product-image-url"
            value={values.primary_image_url}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                primary_image_url: event.target.value,
              }))
            }
            placeholder="https://..."
          />
        </Field>

        <Field label="Descripcion" htmlFor="product-description">
          <Textarea
            id="product-description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Detalles del articulo"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-white/60 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={values.track_inventory}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                track_inventory: event.target.checked,
              }))
            }
          />
          Controlar inventario
        </label>

        {!isEditMode ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Stock inicial" htmlFor="product-initial-stock">
              <Input
                id="product-initial-stock"
                type="number"
                min="0"
                step="0.001"
                value={values.initial_stock}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    initial_stock: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Ubicacion inicial" htmlFor="product-location">
              <select
                id="product-location"
                className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={values.location_id}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    location_id: event.target.value,
                  }))
                }
              >
                <option value="">Ubicacion por defecto</option>
                {catalogs?.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.isDefault ? " (Default)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white/50 px-4 py-3 text-sm text-muted-foreground">
            El stock, las entradas y los movimientos se siguen gestionando desde
            la pestaña Articulos.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isEditMode ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancelEdit}
              disabled={loading}
            >
              Cancelar edicion
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={resetCreateForm}
              disabled={loading}
            >
              Limpiar formulario
            </Button>
          )}
          <Button
            type="button"
            disabled={loading || isInvalid}
            onClick={async () => {
              await onSubmit(buildPayload());

              if (!isEditMode) {
                resetCreateForm();
              }
            }}
          >
            {loading
              ? isEditMode
                ? "Actualizando..."
                : "Guardando..."
              : isEditMode
                ? "Actualizar articulo"
                : "Guardar articulo"}
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
