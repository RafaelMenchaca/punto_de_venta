export const APP_NAME = "Punto de Venta";
export const API_PREFIX = "api";

export const DEV_HEADER_NAMES = {
  userId: "x-dev-user-id",
  businessId: "x-dev-business-id",
  branchId: "x-dev-branch-id",
  registerId: "x-dev-register-id",
} as const;

export const ROUTES = {
  dashboard: "/dashboard",
  cash: "/cash",
  inventory: "/inventory",
  pos: "/pos",
} as const;
