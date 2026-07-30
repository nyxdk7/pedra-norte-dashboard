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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contratos", href: "/contratos", icon: ClipboardList },
  { label: "Medições", href: "/medicoes", icon: FileSpreadsheet },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
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
  if (isSuperuser) return "Administrador";
  return grupos[0] || "Usuário";
}

function obterIniciais(nome: string) {
  const partes = nome.trim().split(" ").filter(Boolean);
  if (!partes.length) return "MS";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
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
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#223044] bg-[#172231] text-white transition-[width] duration-200 ${
        collapsed ? "w-[72px]" : "w-[242px]"
      }`}
    >
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-3">
        {collapsed ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/15 text-xs font-semibold text-blue-100">
            MS
          </div>
        ) : (
          <Brand dark />
        )}

        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {!collapsed && (
          <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
            Navegação
          </p>
        )}

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition ${
                  active
                    ? "bg-blue-500/15 text-blue-100"
                    : "text-slate-300 hover:bg-white/7 hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={`mb-3 flex items-center gap-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-semibold text-white">
            {obterIniciais(nomeUsuario)}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">
                {nomeUsuario}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {perfilUsuario}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSair}
          title={collapsed ? "Sair" : undefined}
          className={`flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/10 text-[12px] font-medium text-slate-300 transition hover:bg-white/7 hover:text-white ${
            collapsed ? "px-0" : "px-3"
          }`}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.7} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
