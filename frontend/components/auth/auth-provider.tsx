"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  buscarUsuarioLogado,
  logoutUsuario,
  type UsuarioLogado,
} from "@/lib/api";

type AuthContextData = {
  usuario: UsuarioLogado | null;
  carregando: boolean;
  autenticado: boolean;
  recarregarUsuario: () => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregarUsuario = useCallback(async () => {
    try {
      setCarregando(true);
      const usuarioAtual = await buscarUsuarioLogado();
      setUsuario(usuarioAtual);
    } catch {
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const sair = useCallback(async () => {
    try {
      await logoutUsuario();
    } finally {
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    recarregarUsuario();
  }, [recarregarUsuario]);

  const value = useMemo<AuthContextData>(
    () => ({
      usuario,
      carregando,
      autenticado: Boolean(usuario),
      recarregarUsuario,
      sair,
    }),
    [usuario, carregando, recarregarUsuario, sair],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}