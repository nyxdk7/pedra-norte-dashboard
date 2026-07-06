import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ChartPaletteApplier } from "@/components/configuracoes/chart-palette-applier";
import { AppShell } from "@/components/layout/app-shell";

type PainelLayoutProps = {
  children: ReactNode;
};

export default function PainelLayout({ children }: PainelLayoutProps) {
  return (
    <AuthProvider>
      <ChartPaletteApplier />

      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </AuthProvider>
  );
}