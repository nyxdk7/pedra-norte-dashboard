"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth/auth-provider";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { carregando, autenticado } = useAuth();

  useEffect(() => {
    if (!carregando && !autenticado) {
      router.replace("/login");
    }
  }, [carregando, autenticado, router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="border border-slate-200 bg-white px-8 py-7 shadow-sm">
          <div className="mb-5 flex justify-center">
            <Brand />
          </div>

          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
            <span className="h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900" />
            Verificando sessão...
          </div>
        </div>
      </main>
    );
  }

  if (!autenticado) {
    return null;
  }

  return children;
}