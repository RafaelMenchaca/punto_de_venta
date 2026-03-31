"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
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
import { Label } from "@/components/ui/label";
import {
  useCreateInventoryLocationMutation,
  useDeactivateInventoryLocationMutation,
  useReactivateInventoryLocationMutation,
  useUpdateInventoryLocationMutation,
} from "@/features/inventory/hooks";
import { formatInventoryQuantity } from "@/features/inventory/presentation";
import type { InventoryLocationOption } from "@/features/inventory/types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

const createEmptyValues = () => ({
  name: "",
  code: "",
  isDefault: false,
});

export function InventoryLocationManager({
  businessId,
  branchId,
  locations,
  loading,
  errorMessage,
  onRetry,
}: {
  businessId: string;
  branchId: string;
  locations: InventoryLocationOption[];
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  const createMutation = useCreateInventoryLocationMutation(businessId, branchId);
  const updateMutation = useUpdateInventoryLocationMutation(businessId, branchId);
  const deactivateMutation = useDeactivateInventoryLocationMutation(
    businessId,
    branchId,
  );
  const reactivateMutation = useReactivateInventoryLocationMutation(
    businessId,
    branchId,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [values, setValues] = useState(createEmptyValues);

  const filteredLocations = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return locations;
    }

    return locations.filter((location) =>
      [location.name, location.code].some((value) =>
        value.toLowerCase().includes(normalizedTerm),
      ),
    );
  }, [locations, searchTerm]);

  const editingLocation = editingLocationId
    ? locations.find((location) => location.id === editingLocationId) ?? null
    : null;

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isInvalid =
    values.name.trim().length === 0 || values.code.trim().length === 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingLocation ? `Editando ubicacion: ${editingLocation.name}` : "Ubicaciones"}
          </CardTitle>
          <CardDescription>
            Administra ubicaciones de la sucursal actual y define cual es la
            default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inventory-location-name">Nombre</Label>
            <Input
              id="inventory-location-name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Piso de venta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory-location-code">Codigo</Label>
            <Input
              id="inventory-location-code"
              value={values.code}
              onChange={(event) =>
                setValues((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="PV"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border bg-white/60 px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={values.isDefault}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  isDefault: event.target.checked,
                }))
              }
            />
            Marcar como ubicacion default
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {editingLocation ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setEditingLocationId(null);
                  setValues(createEmptyValues());
                }}
              >
                Cancelar edicion
              </Button>
            ) : null}

            <Button
              type="button"
              disabled={isSaving || isInvalid}
              onClick={async () => {
                try {
                  if (editingLocationId) {
                    await updateMutation.mutateAsync({
                      locationId: editingLocationId,
                      payload: {
                        business_id: businessId,
                        branch_id: branchId,
                        name: values.name.trim(),
                        code: values.code.trim(),
                        is_default: values.isDefault,
                      },
                    });
                    toast.success("Ubicacion actualizada.");
                  } else {
                    await createMutation.mutateAsync({
                      business_id: businessId,
                      branch_id: branchId,
                      name: values.name.trim(),
                      code: values.code.trim(),
                      is_default: values.isDefault,
                    });
                    toast.success("Ubicacion guardada.");
                  }

                  setEditingLocationId(null);
                  setValues(createEmptyValues());
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      editingLocationId
                        ? "No se pudo guardar la ubicacion."
                        : "No se pudo crear la ubicacion.",
                    ),
                  );
                }
              }}
            >
              {isSaving
                ? "Guardando..."
                : editingLocation
                  ? "Actualizar ubicacion"
                  : "Guardar ubicacion"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de ubicaciones</CardTitle>
          <CardDescription>
            Activa, desactiva o reactiva ubicaciones sin salir del modulo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o codigo"
            />
            <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
              {filteredLocations.length} ubicacion
              {filteredLocations.length === 1 ? "" : "es"}
            </div>
          </div>

          {loading ? (
            <NoticeBanner message="Actualizando ubicaciones..." />
          ) : null}

          {errorMessage ? (
            <ErrorState
              message={errorMessage}
              actionLabel="Reintentar"
              onAction={onRetry}
            />
          ) : null}

          {!errorMessage && filteredLocations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
              No hay ubicaciones que coincidan con la busqueda actual.
            </div>
          ) : null}

          <div className="space-y-3">
            {filteredLocations.map((location) => {
              const deactivateLoading =
                deactivateMutation.isPending &&
                deactivateMutation.variables?.locationId === location.id;
              const reactivateLoading =
                reactivateMutation.isPending &&
                reactivateMutation.variables?.locationId === location.id;

              return (
                <div
                  key={location.id}
                  className={`rounded-2xl border p-4 ${
                    location.isActive
                      ? "border-border bg-white/60"
                      : "border-border bg-slate-100/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{location.name}</p>
                        <Badge variant={location.isActive ? "success" : "destructive"}>
                          {location.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                        {location.isDefault ? <Badge>Default</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Codigo: {location.code}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>
                          Total:{" "}
                          {formatInventoryQuantity(location.totalQuantity ?? 0)} uds
                        </span>
                        <span>
                          Disponible:{" "}
                          {formatInventoryQuantity(
                            location.availableQuantity ?? 0,
                          )}{" "}
                          uds
                        </span>
                        <span>
                          Productos:{" "}
                          {formatInventoryQuantity(location.productsCount ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingLocationId(location.id);
                          setValues({
                            name: location.name,
                            code: location.code,
                            isDefault: location.isDefault,
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={location.isActive ? "destructive" : "default"}
                        disabled={deactivateLoading || reactivateLoading}
                        onClick={async () => {
                          try {
                            if (location.isActive) {
                              await deactivateMutation.mutateAsync({
                                locationId: location.id,
                                payload: {
                                  business_id: businessId,
                                  branch_id: branchId,
                                },
                              });
                              toast.success("Ubicacion desactivada.");
                            } else {
                              await reactivateMutation.mutateAsync({
                                locationId: location.id,
                                payload: {
                                  business_id: businessId,
                                  branch_id: branchId,
                                },
                              });
                              toast.success("Ubicacion reactivada.");
                            }
                          } catch (error) {
                            toast.error(
                              getFriendlyErrorMessage(
                                error,
                                location.isActive
                                  ? "No se pudo desactivar la ubicacion."
                                  : "No se pudo reactivar la ubicacion.",
                              ),
                            );
                          }
                        }}
                      >
                        {deactivateLoading || reactivateLoading
                          ? "Guardando..."
                          : location.isActive
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
    </div>
  );
}
