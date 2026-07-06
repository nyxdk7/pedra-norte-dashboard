import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa/pwa-register";

type PainelLayoutProps = {
  children: ReactNode;
};

export default function PainelLayout({ children }: PainelLayoutProps) {
  return (
    <AuthProvider>
      <PwaRegister />

      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </AuthProvider>
  );
}