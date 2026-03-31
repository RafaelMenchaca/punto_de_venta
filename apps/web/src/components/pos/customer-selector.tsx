"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomerMutation,
  useCustomersQuery,
} from "@/features/customers/hooks";
import type { CustomerRecord } from "@/features/customers/types";
import type { SaleCustomer } from "@/features/sales/types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

const mapCustomerRecord = (customer: CustomerRecord): SaleCustomer => ({
  id: customer.id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
  notes: customer.notes,
});

export interface CustomerDraftValues {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export function CustomerSelector({
  businessId,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
}: {
  businessId: string;
  selectedCustomer: SaleCustomer | null;
  onSelectCustomer: (customer: SaleCustomer) => void;
  onClearCustomer: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const customersQuery = useCustomersQuery(businessId, searchTerm, 8);
  const createCustomerMutation = useCreateCustomerMutation(businessId);

  const customerResults = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data],
  );

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setShowCreateForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cliente</CardTitle>
        <CardDescription>
          La venta puede hacerse sin cliente, pero aqui puedes asociarlo o
          darlo de alta sin salir del POS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.4rem] border border-border/80 bg-muted/55 p-4">
          {selectedCustomer ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Cliente seleccionado
                  </p>
                  <Badge variant="success">Listo para cobrar</Badge>
                </div>
                <p className="font-semibold">{selectedCustomer.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {[selectedCustomer.phone, selectedCustomer.email]
                    .filter(Boolean)
                    .join(" | ") || "Sin datos adicionales"}
                </p>
              </div>

              <Button type="button" variant="outline" onClick={onClearCustomer}>
                Quitar cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Venta sin cliente
              </p>
              <p className="font-medium">No hay cliente asociado por ahora.</p>
              <p className="text-sm text-muted-foreground">
                Puedes continuar asi o seleccionar uno para dejar mejor trazabilidad.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Input
            placeholder="Buscar por nombre, telefono o email"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Button
            type="button"
            variant={showCreateForm ? "secondary" : "outline"}
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? "Ocultar alta" : "Nuevo cliente"}
          </Button>
        </div>

        {customersQuery.error instanceof Error ? (
          <ErrorState
            message={getFriendlyErrorMessage(
              customersQuery.error,
              "No se pudieron cargar los clientes en este momento.",
            )}
            actionLabel="Reintentar"
            onAction={() => void customersQuery.refetch()}
          />
        ) : null}

        {customersQuery.isLoading && !customersQuery.data ? (
          <LoadingState message="Buscando clientes..." />
        ) : null}

        {!customersQuery.isLoading &&
        !customersQuery.error &&
        customerResults.length === 0 ? (
          <EmptyState
            title="Sin coincidencias"
            description="Todavia no hay clientes para este criterio. Puedes crear uno nuevo aqui mismo."
          />
        ) : null}

        {customerResults.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Resultados
              </p>
              <p className="text-sm text-muted-foreground">
                {customerResults.length} resultado
                {customerResults.length === 1 ? "" : "s"}
              </p>
            </div>
            {customerResults.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col gap-3 rounded-[1.35rem] border border-border/80 bg-white/72 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)] lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-medium">{customer.fullName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[customer.phone, customer.email]
                      .filter(Boolean)
                      .join(" | ") || "Sin telefono ni email"}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelectCustomer(mapCustomerRecord(customer))}
                >
                  Seleccionar
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {showCreateForm ? (
          <form
            className="space-y-4 rounded-[1.45rem] border border-border/80 bg-white/72 p-5 shadow-[0_12px_24px_rgba(23,23,23,0.05)]"
            onSubmit={(event) => {
              event.preventDefault();

              if (!fullName.trim()) {
                toast.error("El nombre del cliente es obligatorio.");
                return;
              }

              void createCustomerMutation
                .mutateAsync({
                  business_id: businessId,
                  full_name: fullName.trim(),
                  email: email.trim() || undefined,
                  phone: phone.trim() || undefined,
                  notes: notes.trim() || undefined,
                })
                .then((customer) => {
                  const mappedCustomer = mapCustomerRecord(customer);
                  onSelectCustomer(mappedCustomer);
                  toast.success("Cliente creado correctamente.");
                  resetForm();
                  setSearchTerm(mappedCustomer.fullName ?? "");
                })
                .catch((error) => {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      "No se pudo crear el cliente.",
                    ),
                  );
                });
            }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Alta rapida
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Captura solo los datos minimos para continuar la venta.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Nombre completo"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
              <Input
                placeholder="Telefono"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <Input
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Textarea
              placeholder="Notas opcionales"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending
                  ? "Guardando..."
                  : "Guardar cliente"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
