"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, RefreshCw, Save, ShieldCheck, UserPlus } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  buscarUsuariosAdmin,
  criarUsuarioAdmin,
  type UsuarioAdminResumo,
  usuarioPodeAdministrar,
} from "@/lib/api";

export function AdministradorClient() {
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioAdminResumo[]>([]);
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [senhaTemporaria, setSenhaTemporaria] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const podeAdministrar = usuarioPodeAdministrar(usuario);

  const carregarUsuarios = useCallback(async () => {
    if (!podeAdministrar) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const resposta = await buscarUsuariosAdmin();

      setUsuarios(resposta.results);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os usuários.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }, [podeAdministrar]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta = await criarUsuarioAdmin({
        nome,
        username,
        senha_temporaria: senhaTemporaria,
      });

      setUsuarios((listaAtual) => [resposta.usuario, ...listaAtual]);

      setNome("");
      setUsername("");
      setSenhaTemporaria("");

      setSucesso(
        "Usuário criado com sucesso. No primeiro acesso, ele deverá trocar a senha.",
      );
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível criar o usuário.";

      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (!podeAdministrar) {
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-7">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Administração de usuários
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Crie usuários com senha temporária e troca obrigatória no primeiro acesso.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-slate-700" />

            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-950">
              Novo usuário
            </h3>
          </div>

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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Nome
              </label>

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: João Silva"
                className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Usuário
              </label>

              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ex: joao.silva"
                autoComplete="username"
                className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Senha temporária
              </label>

              <input
                type="password"
                value={senhaTemporaria}
                onChange={(event) => setSenhaTemporaria(event.target.value)}
                placeholder="Senha inicial do usuário"
                autoComplete="new-password"
                className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="flex gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />

                <p>
                  A senha criada aqui é temporária. No primeiro login, o usuário
                  será obrigado a cadastrar uma nova senha.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="flex h-11 w-full items-center justify-center gap-2 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {salvando ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>

        <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Usuários cadastrados
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {usuarios.length}
              </p>
            </div>

            <button
              type="button"
              onClick={carregarUsuarios}
              className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-500">Carregando usuários...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Senha</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.length ? (
                    usuarios.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-950">
                          {item.nome}
                        </td>

                        <td className="px-4 py-3">{item.username}</td>

                        <td className="px-4 py-3">
                          {item.is_superuser
                            ? "Administrador"
                            : item.grupos[0] || "Usuário"}
                        </td>

                        <td className="px-4 py-3">
                          {item.deve_trocar_senha ? (
                            <span className="bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                              Troca pendente
                            </span>
                          ) : (
                            <span className="bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                              Definida
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {item.is_active ? (
                            <span className="bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                              Ativo
                            </span>
                          ) : (
                            <span className="bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                              Inativo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}