"use client";

import { useEffect, useState } from "react";

import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [menuRecolhido, setMenuRecolhido] = useState(false);

  useEffect(() => {
    const valorSalvo = localStorage.getItem("pedra_norte_menu_recolhido");
    setMenuRecolhido(valorSalvo === "true");
  }, []);

  function alternarMenu() {
    setMenuRecolhido((valorAtual) => {
      const novoValor = !valorAtual;
      localStorage.setItem("pedra_norte_menu_recolhido", String(novoValor));
      return novoValor;
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppSidebar collapsed={menuRecolhido} onToggle={alternarMenu} />

      <main
        className={[
          "min-h-screen pb-20 transition-[margin] duration-200 lg:pb-0",
          menuRecolhido ? "lg:ml-20" : "lg:ml-72",
        ].join(" ")}
      >
        {children}
      </main>

      <AppMobileNav />
    </div>
  );
}