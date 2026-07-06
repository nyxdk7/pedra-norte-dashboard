import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pedra Norte Dashboard",
  description: "Dashboard corporativo de contratos, medições e evolução de obras da Pedra Norte.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}