"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Palette, Save } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useChartPalette } from "@/components/configuracoes/chart-palette-provider";
import {
  CHART_PALETTES,
  getChartPaletteById,
  type ChartPaletteId,
} from "@/lib/chart-palettes";
import { usuarioPodeAdministrar } from "@/lib/api";

export function ConfiguracoesClient() {
  const { usuario } = useAuth();
  const {
    palette,
    paletteId,
    carregando,
    erro: erroPaleta,
    salvarPaleta,
  } = useChartPalette();

  const [paletteSelecionadaId, setPaletteSelecionadaId] =
    useState<ChartPaletteId>("msm-industrial");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const podeAdministrar = usuarioPodeAdministrar(usuario);

  useEffect(() => {
    setPaletteSelecionadaId(paletteId);
  }, [paletteId]);

  const paletteSelecionada = useMemo(
    () => getChartPaletteById(paletteSelecionadaId),
    [paletteSelecionadaId],
  );

  const temAlteracaoPendente = palette.id !== paletteSelecionadaId;

  async function handleSalvar() {
    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      await salvarPaleta(paletteSelecionadaId);

      setMensagem(
        "Paleta salva com sucesso. A configuração agora está gravada no sistema.",
      );

      window.setTimeout(() => {
        setMensagem("");
      }, 3500);
    } catch (error) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a paleta.";

      setErro(mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-7">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
                <Palette className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Paleta de cores dos gráficos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Escolha a paleta e clique em salvar para aplicar em todo o
                  sistema.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={
              carregando ||
              salvando ||
              !temAlteracaoPendente ||
              !podeAdministrar
            }
            className="flex h-11 items-center justify-center gap-2 bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {salvando ? "Salvando..." : "Salvar paleta"}
          </button>
        </div>

        <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Paleta ativa no sistema:{" "}
            <span className="font-semibold text-slate-950">{palette.nome}</span>
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Paleta selecionada:{" "}
            <span className="font-semibold text-slate-950">
              {paletteSelecionada.nome}
            </span>
          </p>

          {temAlteracaoPendente && podeAdministrar && (
            <p className="mt-1 text-sm font-semibold text-amber-700">
              Há alteração pendente. Clique em salvar para aplicar.
            </p>
          )}

          {!podeAdministrar && (
            <p className="mt-1 text-sm font-semibold text-amber-700">
              Somente administradores podem alterar a paleta global do sistema.
            </p>
          )}

          {mensagem && (
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {mensagem}
            </p>
          )}

          {(erro || erroPaleta) && (
            <p className="mt-1 text-sm font-semibold text-red-700">
              {erro || erroPaleta}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {CHART_PALETTES.map((item) => {
          const selecionada = item.id === paletteSelecionadaId;
          const ativa = item.id === palette.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPaletteSelecionadaId(item.id)}
              className={`border bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-400 hover:bg-slate-50 ${
                selecionada
                  ? "border-slate-950 ring-2 ring-slate-950/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-950">
                    {item.nome}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.descricao}
                  </p>

                  {ativa && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Paleta ativa
                    </p>
                  )}
                </div>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                    selecionada
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-8 overflow-hidden border border-slate-200">
                {item.cores.map((cor) => (
                  <div
                    key={`${item.id}-${cor}`}
                    className="h-12"
                    style={{
                      backgroundColor: cor,
                    }}
                    title={cor}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.cores.map((cor) => (
                  <span
                    key={`${item.id}-tag-${cor}`}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500"
                  >
                    {cor}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-base font-semibold text-slate-950">Como funciona</h2>

        <div className="mt-3 grid gap-3 text-sm text-slate-600 lg:grid-cols-3">
          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">1. Escolha a paleta</p>
            <p className="mt-2 leading-6">
              Clique em uma das opções para visualizar a seleção.
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">2. Salve no sistema</p>
            <p className="mt-2 leading-6">
              A paleta fica gravada no banco e passa a valer para todos.
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">3. Sem atraso visual</p>
            <p className="mt-2 leading-6">
              O painel carrega a paleta antes de exibir os gráficos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}