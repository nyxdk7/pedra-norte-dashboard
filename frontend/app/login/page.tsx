import { ArrowRight, Eye, Lock, ShieldCheck, User } from "lucide-react";

import { Brand } from "@/components/brand";

export default function LoginPage() {
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

          <form className="space-y-5 px-7 py-6">
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
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="h-full w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="ml-3 text-slate-400 transition hover:text-slate-700"
                  aria-label="Mostrar senha"
                >
                  <Eye size={19} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  defaultChecked
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
              className="flex h-12 w-full items-center justify-center gap-2 bg-slate-700 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Entrar
              <ArrowRight size={18} />
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