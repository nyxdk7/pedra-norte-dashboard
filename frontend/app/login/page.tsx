"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Brand } from "@/components/brand";
import { loginUsuario } from "@/lib/api";

const STORAGE_KEY = "msm_industrial_usuario";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lembrarUsuario, setLembrarUsuario] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const usuarioSalvo = window.localStorage.getItem(STORAGE_KEY);

      if (usuarioSalvo) {
        setUsername(usuarioSalvo);
        setLembrarUsuario(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCarregando(true);
      setErro("");

      await loginUsuario(username.trim(), password);

      if (lembrarUsuario) {
        window.localStorage.setItem(STORAGE_KEY, username.trim());
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }

      router.replace("/dashboard");
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível entrar no sistema.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Brand />
          </div>

          <div className="border border-slate-200 bg-white rounded-md shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Entrar no sistema
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use seu usuário e senha para acessar o painel.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
              {erro && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {erro}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  Usuário
                </label>

                <div className="relative">
                  <User
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Ex: admin"
                    autoComplete="username"
                    className="h-11 w-full border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  Senha
                </label>

                <div className="relative">
                  <Lock
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={mostrarSenha ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="h-11 w-full border border-slate-300 bg-white pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((valor) => !valor)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={lembrarUsuario}
                    onChange={(event) =>
                      setLembrarUsuario(event.target.checked)
                    }
                    className="h-4 w-4 accent-[#111827]"
                  />

                  Lembrar usuário
                </label>

                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <ShieldCheck size={18} />
                  Sessão protegida
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="flex h-13 w-full items-center justify-center gap-2 bg-[#111827] px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {carregando ? "Entrando..." : "Entrar"}
                {!carregando && <ArrowRight size={20} />}
              </button>
            </form>
          </div>

          <p className="mt-7 text-center text-sm text-slate-500">
            msm industrial · aplicação interna
          </p>
        </div>
      </section>
    </main>
  );
}