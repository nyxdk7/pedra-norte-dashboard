"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Brand } from "@/components/brand";
import { usuarioPodeAdministrar } from "@/lib/api";

const menuBaseItems = [
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
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

const adminItem = {
  label: "Administrador",
  href: "/administrador",
  icon: ShieldCheck,
};

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

function obterPerfilUsuario(grupos: string[], isSuperuser: boolean) {
  if (isSuperuser) {
    return "Administrador";
  }

  if (!grupos.length) {
    return "Usuário";
  }

  return grupos[0];
}

function obterIniciais(nome: string) {
  const partes = nome.trim().split(" ").filter(Boolean);

  if (!partes.length) {
    return "MS";
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
    ? obterPerfilUsuario(
        usuario.permissions.grupos,
        usuario.permissions.is_superuser,
      )
    : "Usuário";

  const menuItems = usuarioPodeAdministrar(usuario)
    ? [...menuBaseItems, adminItem]
    : menuBaseItems;

  async function handleSair() {
    await sair();
    router.replace("/login");
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 ${
        collapsed ? "w-[76px]" : "w-[280px]"
      }`}
    >
      <div className="flex h-[104px] items-center justify-between border-b border-slate-800 px-4">
        {collapsed ? (
          <div className="flex h-11 w-11 items-center justify-center border border-slate-700 bg-slate-900 text-sm font-black text-white">
            MS
          </div>
        ) : (
          <Brand />
        )}

        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center border border-slate-700 text-slate-300 transition hover:bg-slate-900 hover:text-white"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex h-12 items-center gap-3 px-3 text-sm font-semibold transition ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="h-5 w-5 shrink-0" />

              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div
          className={`mb-4 flex items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-800 text-xs font-black text-white">
            {obterIniciais(nomeUsuario)}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {nomeUsuario}
              </p>

              <p className="truncate text-xs text-slate-400">{perfilUsuario}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSair}
          title={collapsed ? "Sair" : undefined}
          className={`flex h-11 w-full items-center gap-3 border border-slate-700 px-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white ${
            collapsed ? "justify-center" : "justify-center"
          }`}
        >
          <LogOut className="h-4 w-4" />

          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}