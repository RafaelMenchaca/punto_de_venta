import {
  CreditCard,
  LayoutDashboard,
  Package2,
  ShoppingCart,
  Wallet,
} from "lucide-react";

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/pos",
    label: "POS",
    icon: CreditCard,
  },
  {
    href: "/inventory",
    label: "Inventario",
    icon: Package2,
  },
  {
    href: "/purchasing",
    label: "Compras",
    icon: ShoppingCart,
  },
  {
    href: "/cash",
    label: "Caja",
    icon: Wallet,
  },
] as const;
