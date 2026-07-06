"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: ClipboardList,
  },
  {
    label: "Medições",
    href: "/medicoes",
    icon: FileSpreadsheet,
  },
  {
    label: "Histórico",
    href: "/historico",
    icon: History,
  },
];

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
              active ? "text-slate-950" : "text-slate-500",
            ].join(" ")}
          >
            <Icon size={20} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}