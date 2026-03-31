"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import {
  useCreatePurchasingSupplierMutation,
  useDeactivatePurchasingSupplierMutation,
  useReactivatePurchasingSupplierMutation,
  useUpdatePurchasingSupplierMutation,
} from "@/features/purchasing/hooks";
import type { PurchasingSupplier } from "@/features/purchasing/types";
import { getSupplierStatusLabel } from "@/features/purchasing/utils";

const emptySupplierForm = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

export function SupplierManager({
  businessId,
  branchId,
  suppliers,
}: {
  businessId: string;
  branchId: string;
  suppliers: PurchasingSupplier[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] =
    useState<PurchasingSupplier | null>(null);
  const [formValues, setFormValues] = useState(emptySupplierForm);
  const [highlight, setHighlight] = useState(false);
  const highlightTimerRef = useRef<number | null>(null);

  const createMutation = useCreatePurchasingSupplierMutation(
    businessId,
    branchId,
  );
  const updateMutation = useUpdatePurchasingSupplierMutation(
    businessId,
    branchId,
  );
  const deactivateMutation = useDeactivatePurchasingSupplierMutation(
    businessId,
    branchId,
  );
  const reactivateMutation = useReactivatePurchasingSupplierMutation(
    businessId,
    branchId,
  );

  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );

  const triggerHighlight = () => {
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }

    setHighlight(true);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlight(false);
      highlightTimerRef.current = null;
    }, 2200);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    [supplier.name, supplier.contactName, supplier.email, supplier.phone]
      .filter(Boolean)
      .some((value) =>
        value?.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      ),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>Proveedores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              placeholder="Buscar proveedor por nombre, contacto, correo o telefono"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
              {filteredSuppliers.length} proveedor
              {filteredSuppliers.length === 1 ? "" : "es"}
            </div>
          </div>

          <div className="space-y-3">
            {filteredSuppliers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
                No hay proveedores que coincidan con la busqueda.
              </div>
            ) : null}

            {filteredSuppliers.map((supplier) => {
              const deactivateLoading =
                deactivateMutation.isPending &&
                deactivateMutation.variables?.supplierId === supplier.id;
              const reactivateLoading =
                reactivateMutation.isPending &&
                reactivateMutation.variables?.supplierId === supplier.id;

              return (
                <div
                  key={supplier.id}
                  className={cn(
                    "rounded-[1.35rem] border p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]",
                    supplier.isActive
                      ? "border-border bg-white/60"
                      : "border-dashed border-slate-300 bg-slate-100/70 text-slate-700",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{supplier.name}</p>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase tracking-[0.18em]">
                          {getSupplierStatusLabel(supplier.isActive)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[
                          supplier.contactName,
                          supplier.phone,
                          supplier.email,
                        ]
                          .filter(Boolean)
                          .join(" | ") || "Sin contacto"}
                      </p>
                      {supplier.address ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {supplier.address}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setFormValues({
                            name: supplier.name,
                            contactName: supplier.contactName ?? "",
                            email: supplier.email ?? "",
                            phone: supplier.phone ?? "",
                            address: supplier.address ?? "",
                            notes: supplier.notes ?? "",
                          });
                          triggerHighlight();
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={supplier.isActive ? "destructive" : "default"}
                        disabled={deactivateLoading || reactivateLoading}
                        onClick={async () => {
                          try {
                            if (supplier.isActive) {
                              await deactivateMutation.mutateAsync({
                                supplierId: supplier.id,
                                payload: { business_id: businessId },
                              });
                              toast.success("Proveedor desactivado.");
                            } else {
                              await reactivateMutation.mutateAsync({
                                supplierId: supplier.id,
                                payload: { business_id: businessId },
                              });
                              toast.success("Proveedor reactivado.");
                            }
                          } catch (error) {
                            toast.error(
                              getFriendlyErrorMessage(
                                error,
                                supplier.isActive
                                  ? "No se pudo desactivar el proveedor."
                                  : "No se pudo reactivar el proveedor.",
                              ),
                            );
                          }
                        }}
                      >
                        {deactivateLoading || reactivateLoading
                          ? "Guardando..."
                          : supplier.isActive
                            ? "Desactivar"
                            : "Reactivar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          highlight
            ? "border-primary/40 bg-primary/5 shadow-[0_0_0_4px_rgba(15,118,110,0.12)] transition-all"
            : undefined
        }
      >
        <CardHeader>
          <CardTitle>
            {editingSupplier ? `Editando proveedor: ${editingSupplier.name}` : "Nuevo proveedor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" htmlFor="supplier-name">
              <Input
                id="supplier-name"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Contacto" htmlFor="supplier-contact">
              <Input
                id="supplier-contact"
                value={formValues.contactName}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    contactName: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Correo" htmlFor="supplier-email">
              <Input
                id="supplier-email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Telefono" htmlFor="supplier-phone">
              <Input
                id="supplier-phone"
                value={formValues.phone}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <Field label="Direccion" htmlFor="supplier-address">
            <Input
              id="supplier-address"
              value={formValues.address}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Notas" htmlFor="supplier-notes">
            <Textarea
              id="supplier-notes"
              value={formValues.notes}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {editingSupplier ? (
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  setEditingSupplier(null);
                  setFormValues(emptySupplierForm);
                  setHighlight(false);
                  if (highlightTimerRef.current) {
                    window.clearTimeout(highlightTimerRef.current);
                    highlightTimerRef.current = null;
                  }
                }}
              >
                Cancelar edicion
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={() => setFormValues(emptySupplierForm)}
              >
                Limpiar formulario
              </Button>
            )}

            <Button
              type="button"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                formValues.name.trim().length === 0
              }
              onClick={async () => {
                const payload = {
                  business_id: businessId,
                  name: formValues.name.trim(),
                  contact_name: formValues.contactName.trim() || undefined,
                  email: formValues.email.trim() || undefined,
                  phone: formValues.phone.trim() || undefined,
                  address: formValues.address.trim() || undefined,
                  notes: formValues.notes.trim() || undefined,
                };

                try {
                  if (editingSupplier) {
                    await updateMutation.mutateAsync({
                      supplierId: editingSupplier.id,
                      payload,
                    });
                    toast.success("Proveedor actualizado.");
                    setEditingSupplier(null);
                  } else {
                    await createMutation.mutateAsync(payload);
                    toast.success("Proveedor creado.");
                  }

                  setFormValues(emptySupplierForm);
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      editingSupplier
                        ? "No se pudo actualizar el proveedor."
                        : "No se pudo crear el proveedor.",
                    ),
                  );
                }
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Guardando..."
                : editingSupplier
                  ? "Actualizar proveedor"
                  : "Crear proveedor"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
