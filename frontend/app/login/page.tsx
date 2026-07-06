"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";

import { Brand } from "@/components/brand";
import { buscarUsuarioLogado, loginUsuario } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarUsuario, setLembrarUsuario] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("pedra_norte_username");

    if (usuarioSalvo) {
      setUsername(usuarioSalvo);
    }

    async function verificarSessao() {
      try {
        await buscarUsuarioLogado();
        router.replace("/dashboard");
      } catch {
        setVerificandoSessao(false);
      }
    }

    verificarSessao();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!username.trim() || !password.trim()) {
      setErro("Informe usuário e senha para entrar.");
      return;
    }

    try {
      setCarregando(true);

      await loginUsuario(username.trim(), password);

      if (lembrarUsuario) {
        localStorage.setItem("pedra_norte_username", username.trim());
      } else {
        localStorage.removeItem("pedra_norte_username");
      }

      router.replace("/dashboard");
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o login.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="border border-slate-200 bg-white px-8 py-7 shadow-sm">
          <div className="mb-5 flex justify-center">
            <Brand />
          </div>

          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
            <span className="h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900" />
            Verificando sessão...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-[520px]">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-7 py-6">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Entrar no sistema
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Use seu usuário e senha para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-7 py-6">
            {erro && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Usuário
              </label>

              <div className="flex h-12 items-center border border-slate-300 bg-white px-3 transition focus-within:border-slate-700 focus-within:ring-2 focus-within:ring-slate-200">
                <User size={19} className="mr-3 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Ex: admin"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-full w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Senha
              </label>

              <div className="flex h-12 items-center border border-slate-300 bg-white px-3 transition focus-within:border-slate-700 focus-within:ring-2 focus-within:ring-slate-200">
                <Lock size={19} className="mr-3 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                  className="ml-3 text-slate-400 transition hover:text-slate-700"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={lembrarUsuario}
                  onChange={(event) => setLembrarUsuario(event.target.checked)}
                  className="h-4 w-4 accent-slate-900"
                />
                Lembrar usuário
              </label>

              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <ShieldCheck size={17} />
                <span>Sessão protegida</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="flex h-12 w-full items-center justify-center gap-2 bg-slate-700 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {carregando ? "Entrando..." : "Entrar"}
              {!carregando && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Pedra Norte Dashboard · Aplicação interna
        </p>
      </section>
    </main>
  );
}