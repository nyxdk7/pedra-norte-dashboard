"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Palette, Save } from "lucide-react";

import {
  CHART_PALETTES,
  getChartPaletteById,
  getStoredChartPalette,
  setStoredChartPalette,
  type ChartPaletteId,
} from "@/lib/chart-palettes";

export function ConfiguracoesClient() {
  const [paletteSalvaId, setPaletteSalvaId] =
    useState<ChartPaletteId>("msm-industrial");
  const [paletteSelecionadaId, setPaletteSelecionadaId] =
    useState<ChartPaletteId>("msm-industrial");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const palette = getStoredChartPalette();

    setPaletteSalvaId(palette.id);
    setPaletteSelecionadaId(palette.id);
  }, []);

  const paletteSelecionada = useMemo(
    () => getChartPaletteById(paletteSelecionadaId),
    [paletteSelecionadaId],
  );

  const temAlteracaoPendente = paletteSalvaId !== paletteSelecionadaId;

  function handleSalvar() {
    setStoredChartPalette(paletteSelecionadaId);
    setPaletteSalvaId(paletteSelecionadaId);
    setMensagem("Paleta salva com sucesso. Os gráficos já usarão as novas cores.");

    window.setTimeout(() => {
      setMensagem("");
    }, 3500);
  }

  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
                <Palette className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-950">
                  Paleta de cores dos gráficos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Escolha a paleta e clique em salvar para aplicar nos gráficos.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={!temAlteracaoPendente}
            className="flex h-11 items-center justify-center gap-2 bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            Salvar paleta
          </button>
        </div>

        <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Paleta selecionada:{" "}
            <span className="font-black text-slate-950">
              {paletteSelecionada.nome}
            </span>
          </p>

          {temAlteracaoPendente && (
            <p className="mt-1 text-sm font-semibold text-amber-700">
              Há alteração pendente. Clique em salvar para aplicar.
            </p>
          )}

          {mensagem && (
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {mensagem}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {CHART_PALETTES.map((palette) => {
          const selecionada = palette.id === paletteSelecionadaId;
          const salva = palette.id === paletteSalvaId;

          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => setPaletteSelecionadaId(palette.id)}
              className={`border bg-white p-5 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50 ${
                selecionada
                  ? "border-slate-950 ring-2 ring-slate-950/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                    {palette.nome}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {palette.descricao}
                  </p>

                  {salva && (
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
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
                {palette.cores.map((cor) => (
                  <div
                    key={`${palette.id}-${cor}`}
                    className="h-12"
                    style={{
                      backgroundColor: cor,
                    }}
                    title={cor}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {palette.cores.map((cor) => (
                  <span
                    key={`${palette.id}-tag-${cor}`}
                    className="border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500"
                  >
                    {cor}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}