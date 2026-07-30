"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const items = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contratos", href: "/contratos", icon: ClipboardList },
  { label: "Medições", href: "/medicoes", icon: FileSpreadsheet },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Ajustes", href: "/configuracoes", icon: Settings },
];

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium ${
                active ? "bg-blue-50 text-blue-700" : "text-slate-500"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
