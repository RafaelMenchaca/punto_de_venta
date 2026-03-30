export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "cashier"
  | "inventory_clerk"
  | "viewer";

const hasAnyRole = (
  role: string | null | undefined,
  allowedRoles: readonly UserRole[],
) => {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role as UserRole);
};

export function canAccessPos(role: string | null | undefined) {
  return hasAnyRole(role, ["owner", "admin", "manager", "cashier"]);
}

export function canAccessCash(role: string | null | undefined) {
  return hasAnyRole(role, ["owner", "admin", "manager", "cashier"]);
}

export function canReadInventory(role: string | null | undefined) {
  return hasAnyRole(role, [
    "owner",
    "admin",
    "manager",
    "inventory_clerk",
    "viewer",
  ]);
}

export function canWriteInventory(role: string | null | undefined) {
  return hasAnyRole(role, ["owner", "admin", "manager", "inventory_clerk"]);
}

export function canReadPurchasing(role: string | null | undefined) {
  return hasAnyRole(role, [
    "owner",
    "admin",
    "manager",
    "inventory_clerk",
    "viewer",
  ]);
}

export function canManagePurchaseOrders(role: string | null | undefined) {
  return hasAnyRole(role, ["owner", "admin", "manager"]);
}

export function canReceivePurchasing(role: string | null | undefined) {
  return hasAnyRole(role, ["owner", "admin", "manager", "inventory_clerk"]);
}

export function canAccessReports(role: string | null | undefined) {
  return hasAnyRole(role, ["owner", "admin", "manager", "viewer"]);
}
