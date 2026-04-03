"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomerMutation,
  useCustomersQuery,
} from "@/features/customers/hooks";
import type { CustomerRecord } from "@/features/customers/types";
import type { SaleCustomer } from "@/features/sales/types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

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
  className,
}: {
  businessId: string;
  selectedCustomer: SaleCustomer | null;
  onSelectCustomer: (customer: SaleCustomer) => void;
  onClearCustomer: () => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
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
    <section
      className={cn(
        "overflow-hidden rounded-[1.2rem] border border-black/10 bg-white/88",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Cliente
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold">
              {selectedCustomer?.fullName ?? "Venta general"}
            </p>
            {selectedCustomer ? <Badge variant="success">Asociado</Badge> : null}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {selectedCustomer
              ? [selectedCustomer.phone, selectedCustomer.email]
                  .filter(Boolean)
                  .join(" | ") || "Sin datos adicionales"
              : "Opcional. No debe interrumpir el flujo de cobro."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {selectedCustomer ? (
            <Button type="button" size="sm" variant="outline" onClick={onClearCustomer}>
              Quitar
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={expanded ? "secondary" : "outline"}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Ocultar" : "Cliente"}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-black/8 px-4 py-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="Buscar por nombre, telefono o email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant={showCreateForm ? "secondary" : "outline"}
              onClick={() => setShowCreateForm((current) => !current)}
            >
              {showCreateForm ? "Ocultar alta" : "Nuevo cliente"}
            </Button>
          </div>

          {customersQuery.error instanceof Error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getFriendlyErrorMessage(
                customersQuery.error,
                "No se pudieron cargar los clientes.",
              )}
            </div>
          ) : null}

          {customersQuery.isLoading && !customersQuery.data ? (
            <p className="text-sm text-muted-foreground">Buscando clientes...</p>
          ) : null}

          {customerResults.length > 0 ? (
            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {customerResults.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/8 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {customer.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
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

          {!customersQuery.isLoading &&
          !customersQuery.error &&
          searchTerm.trim() &&
          customerResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay coincidencias para esta busqueda.
            </p>
          ) : null}

          {showCreateForm ? (
            <form
              className="space-y-3 rounded-xl border border-black/8 bg-muted/20 p-3"
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
                    setExpanded(false);
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
              <div className="grid gap-2 md:grid-cols-2">
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
                className="min-h-20"
                placeholder="Notas opcionales"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending
                    ? "Guardando..."
                    : "Guardar cliente"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
