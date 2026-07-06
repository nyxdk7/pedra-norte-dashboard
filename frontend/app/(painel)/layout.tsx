import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ChartPaletteProvider } from "@/components/configuracoes/chart-palette-provider";
import { AppShell } from "@/components/layout/app-shell";

type PainelLayoutProps = {
  children: ReactNode;
};

export default function PainelLayout({ children }: PainelLayoutProps) {
  return (
    <AuthProvider>
      <ChartPaletteProvider>
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </ChartPaletteProvider>
    </AuthProvider>
  );
}