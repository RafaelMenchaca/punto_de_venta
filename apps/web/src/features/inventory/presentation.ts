import type {
  InventoryAlertStatus,
  InventoryMovementType,
} from "./types";

export function formatInventoryQuantity(value: number) {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(value) ? value : 0);
}

export function getInventoryMovementLabel(type: InventoryMovementType | string) {
  switch (type) {
    case "purchase_in":
      return "Entrada por compra";
    case "sale_out":
      return "Salida por venta";
    case "refund_in":
      return "Entrada por devolucion";
    case "adjustment_in":
      return "Ajuste de entrada";
    case "adjustment_out":
      return "Ajuste de salida";
    case "transfer_in":
      return "Transferencia recibida";
    case "transfer_out":
      return "Transferencia enviada";
    case "return_to_supplier":
      return "Retorno a proveedor";
    default:
      return type.replaceAll("_", " ");
  }
}

export function getInventoryAlertStatusLabel(status: InventoryAlertStatus) {
  switch (status) {
    case "active":
      return "Activa";
    case "resolved":
      return "Resuelta";
    case "dismissed":
      return "Descartada";
    default:
      return status;
  }
}
