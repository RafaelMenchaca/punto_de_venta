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
    description: "Resumen general del negocio y operacion diaria",
    icon: LayoutDashboard,
    access: "all",
  },
  {
    href: "/pos",
    label: "POS",
    description: "Venta, historial y devoluciones desde caja",
    icon: CreditCard,
    access: "pos",
  },
  {
    href: "/inventory",
    label: "Inventario",
    description: "Articulos, stock, ubicaciones y transferencias",
    icon: Package2,
    access: "inventory",
  },
  {
    href: "/purchasing",
    label: "Compras",
    description: "Ordenes, recepciones y proveedores",
    icon: ShoppingCart,
    access: "purchasing",
  },
  {
    href: "/cash",
    label: "Caja",
    description: "Sesion actual, movimientos y conciliacion",
    icon: Wallet,
    access: "cash",
  },
  {
    href: "/reports",
    label: "Reportes",
    description: "Ventas, caja e inventario valorizado",
    icon: PieChart,
    access: "reports",
  },
] as const;
