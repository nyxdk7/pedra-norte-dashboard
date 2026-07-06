"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Lock, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { alterarSenhaObrigatoria } from "@/lib/api";

export function AlterarSenhaObrigatoriaClient() {
  const router = useRouter();
  const { recarregarUsuario } = useAuth();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      await alterarSenhaObrigatoria(novaSenha, confirmarSenha);
      await recarregarUsuario();

      setSucesso("Senha alterada com sucesso.");

      router.replace("/dashboard");
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-amber-300 bg-white text-amber-700">
            <KeyRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-black text-amber-950">
              Troca de senha obrigatória
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-900">
              Você acessou o sistema com uma senha temporária. Para continuar,
              defina uma nova senha de acesso.
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="space-y-4">
          {erro && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {sucesso}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Nova senha
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="password"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
                placeholder="Digite a nova senha"
                autoComplete="new-password"
                className="h-12 w-full border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Confirmar senha
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                className="h-12 w-full border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="flex h-12 w-full items-center justify-center gap-2 bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </div>
      </form>
    </div>
  );
}