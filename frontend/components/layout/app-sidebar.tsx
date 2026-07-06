"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Brand } from "@/components/brand";

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

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function obterNomeUsuario(usuario: {
  username: string;
  first_name?: string;
  last_name?: string;
}) {
  const nomeCompleto = `${usuario.first_name || ""} ${
    usuario.last_name || ""
  }`.trim();

  return nomeCompleto || usuario.username;
}

function obterPerfilUsuario(grupos: string[]) {
  if (!grupos.length) {
    return "Usuário";
  }

  return grupos[0];
}

function obterIniciais(nome: string) {
  const partes = nome.trim().split(" ").filter(Boolean);

  if (!partes.length) {
    return "PN";
  }

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, sair } = useAuth();

  const nomeUsuario = usuario ? obterNomeUsuario(usuario) : "Usuário";
  const perfilUsuario = usuario
    ? obterPerfilUsuario(usuario.permissions.grupos)
    : "Usuário";

  async function handleSair() {
    await sair();
    router.replace("/login");
  }

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 hidden h-screen border-r border-slate-800 bg-[#111827] text-white transition-[width] duration-200 lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      <div className="border-b border-slate-800">
        {collapsed ? (
          <div className="flex h-[84px] flex-col items-center justify-center gap-2">
            <BarChart3 size={22} className="text-slate-200" />

            <button
              type="button"
              onClick={onToggle}
              title="Expandir menu"
              className="flex h-9 w-9 items-center justify-center text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        ) : (
          <div className="flex h-[84px] items-center justify-between gap-3 px-5">
            <Brand dark />

            <button
              type="button"
              onClick={onToggle}
              title="Recolher menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                "flex h-12 items-center text-sm font-medium transition",
                collapsed ? "justify-center px-0" : "gap-3 px-4",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={2} />

              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div
          className={[
            "mb-4 flex items-center",
            collapsed ? "justify-center" : "gap-3",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-800 text-sm font-bold uppercase text-white">
            {obterIniciais(nomeUsuario)}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {nomeUsuario}
              </p>
              <p className="truncate text-xs text-slate-400">
                {perfilUsuario}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSair}
          title={collapsed ? "Sair" : undefined}
          className={[
            "flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900 hover:text-white",
            collapsed ? "px-0" : "border border-slate-700",
          ].join(" ")}
        >
          <LogOut size={18} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}