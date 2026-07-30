"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: ReactNode;
};

const mobileMenuItems = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contratos", href: "/contratos", icon: ClipboardList },
  { label: "Medições", href: "/medicoes", icon: FileSpreadsheet },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Ajustes", href: "/configuracoes", icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((valorAtual) => !valorAtual)}
        />
      </div>

      <main
        className={`min-h-screen pb-20 transition-[padding] duration-200 lg:pb-0 ${
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[242px]"
        }`}
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white lg:hidden">
        <div className="grid grid-cols-5">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
