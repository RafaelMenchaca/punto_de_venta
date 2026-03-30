import {
  CreditCard,
  LayoutDashboard,
  Package2,
  PieChart,
  ShoppingCart,
  Wallet,
} from "lucide-react";

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    access: "all",
  },
  {
    href: "/pos",
    label: "POS",
    icon: CreditCard,
    access: "pos",
  },
  {
    href: "/inventory",
    label: "Inventario",
    icon: Package2,
    access: "inventory",
  },
  {
    href: "/purchasing",
    label: "Compras",
    icon: ShoppingCart,
    access: "purchasing",
  },
  {
    href: "/cash",
    label: "Caja",
    icon: Wallet,
    access: "cash",
  },
  {
    href: "/reports",
    label: "Reportes",
    icon: PieChart,
    access: "reports",
  },
] as const;
