export const getPaymentMethodLabel = (paymentMethod: string) => {
  switch (paymentMethod) {
    case "cash":
      return "Efectivo";
    case "card":
      return "Tarjeta";
    case "transfer":
      return "Transferencia";
    case "store_credit":
      return "Credito de tienda";
    case "mixed":
      return "Mixto";
    default:
      return paymentMethod;
  }
};

export const getSaleStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "partially_refunded":
      return "Devolucion parcial";
    case "refunded":
      return "Devuelta";
    case "draft":
      return "Borrador";
    default:
      return status;
  }
};

export const getSaleStatusVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "success" as const;
    case "cancelled":
    case "refunded":
      return "destructive" as const;
    case "partially_refunded":
      return "warning" as const;
    default:
      return "default" as const;
  }
};

export const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "Pagado";
    case "pending":
      return "Pendiente";
    case "partially_paid":
      return "Pago parcial";
    case "refunded":
      return "Reembolsado";
    default:
      return status;
  }
};
