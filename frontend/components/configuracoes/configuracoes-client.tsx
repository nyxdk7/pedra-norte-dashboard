"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";

import {
  CHART_PALETTES,
  getStoredChartPalette,
  setStoredChartPalette,
  type ChartPaletteId,
} from "@/lib/chart-palettes";

export function ConfiguracoesClient() {
  const [paletteId, setPaletteId] =
    useState<ChartPaletteId>("msm-industrial");

  useEffect(() => {
    setPaletteId(getStoredChartPalette().id);
  }, []);

  function handleSelecionarPaleta(id: ChartPaletteId) {
    setPaletteId(id);
    setStoredChartPalette(id);
  }

  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                  Escolha o conjunto de cores usado nos gráficos do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Preferência salva neste navegador.
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {CHART_PALETTES.map((palette) => {
          const selecionada = palette.id === paletteId;

          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => handleSelecionarPaleta(palette.id)}
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

      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-950">
          Como funciona
        </h2>

        <div className="mt-3 grid gap-3 text-sm text-slate-600 lg:grid-cols-3">
          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">1. Escolha a paleta</p>
            <p className="mt-2 leading-6">
              Clique em uma das opções acima para salvar a preferência.
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">2. Atualize o painel</p>
            <p className="mt-2 leading-6">
              Os gráficos passam a usar a paleta selecionada.
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">3. Sem afetar dados</p>
            <p className="mt-2 leading-6">
              Essa configuração muda apenas a aparência visual dos gráficos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}