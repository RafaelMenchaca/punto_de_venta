import { CreditCard, LayoutDashboard, Package2, Wallet } from "lucide-react";

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
    href: "/cash",
    label: "Caja",
    icon: Wallet,
  },
] as const;
