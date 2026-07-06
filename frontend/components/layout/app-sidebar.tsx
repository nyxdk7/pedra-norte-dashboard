"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
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

export function AppSidebar() {
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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-800 bg-slate-950 text-white lg:flex lg:flex-col">
      <div className="border-b border-slate-800 px-5 py-5">
        <Brand dark />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-12 items-center gap-3 px-4 text-sm font-medium transition",
                active
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center bg-slate-800 text-sm font-bold uppercase text-white">
            {nomeUsuario.slice(0, 2)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {nomeUsuario}
            </p>
            <p className="truncate text-xs text-slate-400">{perfilUsuario}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSair}
          className="flex h-11 w-full items-center justify-center gap-2 border border-slate-700 text-sm font-semibold text-slate-200 transition hover:bg-slate-900 hover:text-white"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}