import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PwaRegister } from "@/components/pwa/pwa-register";

import "./globals.css";

export const metadata: Metadata = {
  title: "MSM Industrial",
  description: "Sistema interno de medições",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}