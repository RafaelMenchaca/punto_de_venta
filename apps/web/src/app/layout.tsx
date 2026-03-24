import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Punto de Venta",
  description: "Base operativa para caja, ventas e inventario.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-full font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
