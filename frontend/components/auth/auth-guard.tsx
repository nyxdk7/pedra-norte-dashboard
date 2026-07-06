"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth/auth-provider";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { carregando, autenticado, usuario } = useAuth();

  useEffect(() => {
    if (carregando) {
      return;
    }

    if (!autenticado) {
      router.replace("/login");
      return;
    }

    if (usuario?.deve_trocar_senha && pathname !== "/alterar-senha") {
      router.replace("/alterar-senha");
      return;
    }

    if (!usuario?.deve_trocar_senha && pathname === "/alterar-senha") {
      router.replace("/dashboard");
    }
  }, [carregando, autenticado, usuario, pathname, router]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
          <Brand />

          <p className="mt-6 text-sm font-semibold text-slate-500">
            Verificando sessão...
          </p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return null;
  }

  if (usuario?.deve_trocar_senha && pathname !== "/alterar-senha") {
    return null;
  }

  return children;
}