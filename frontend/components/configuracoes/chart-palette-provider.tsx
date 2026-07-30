"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  CHART_PALETTE_STORAGE_KEY,
  getChartPaletteById,
  getDefaultChartPalette,
  setStoredChartPalette,
  type ChartPalette,
  type ChartPaletteId,
} from "@/lib/chart-palettes";
import {
  buscarConfiguracaoSistema,
  salvarConfiguracaoSistema,
} from "@/lib/system-config";

type ChartPaletteContextValue = {
  carregando: boolean;
  palette: ChartPalette;
  paletteId: ChartPaletteId;
  erro: string;
  recarregarPaleta: () => Promise<void>;
  salvarPaleta: (paletteId: ChartPaletteId) => Promise<void>;
};

const ChartPaletteContext = createContext<ChartPaletteContextValue | null>(null);

type ChartPaletteProviderProps = {
  children: ReactNode;
};

function obterPaletaCacheInicial() {
  if (typeof window === "undefined") {
    return getDefaultChartPalette();
  }

  const paletteId = window.localStorage.getItem(CHART_PALETTE_STORAGE_KEY);

  return getChartPaletteById(paletteId);
}

function montarVariaveisCss(palette: ChartPalette) {
  const style: CSSProperties & Record<string, string> = {};

  palette.cores.forEach((cor, index) => {
    style[`--chart-${index + 1}`] = cor;
  });

  style["--chart-primary"] = palette.cores[0];
  style["--chart-secondary"] = palette.cores[1] || palette.cores[0];
  style["--chart-tertiary"] = palette.cores[2] || palette.cores[0];

  return style;
}

export function ChartPaletteProvider({ children }: ChartPaletteProviderProps) {
  const [palette, setPalette] = useState<ChartPalette>(() =>
    obterPaletaCacheInicial(),
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const recarregarPaleta = useCallback(async () => {
    try {
      setErro("");

      const configuracao = await buscarConfiguracaoSistema();
      const paletteAtual = getChartPaletteById(configuracao.paleta_graficos);

      setPalette(paletteAtual);
      setStoredChartPalette(paletteAtual.id);
    } catch {
      const paletteCache = obterPaletaCacheInicial();

      setPalette(paletteCache);
      setErro(
        "Não foi possível carregar a paleta salva no servidor. Usando a última paleta deste navegador.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  const salvarPaleta = useCallback(async (paletteId: ChartPaletteId) => {
    setErro("");

    const resposta = await salvarConfiguracaoSistema(paletteId);
    const paletteAtual = getChartPaletteById(
      resposta.configuracao.paleta_graficos,
    );

    setPalette(paletteAtual);
    setStoredChartPalette(paletteAtual.id);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void recarregarPaleta();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [recarregarPaleta]);

  const value = useMemo<ChartPaletteContextValue>(
    () => ({
      carregando,
      palette,
      paletteId: palette.id,
      erro,
      recarregarPaleta,
      salvarPaleta,
    }),
    [carregando, palette, erro, recarregarPaleta, salvarPaleta],
  );

  const variaveisCss = useMemo(() => montarVariaveisCss(palette), [palette]);

  if (carregando) {
    return (
      <ChartPaletteContext.Provider value={value}>
        <div
          style={variaveisCss}
          className="flex min-h-screen items-center justify-center bg-slate-100 p-6"
        >
          <div className="border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
            Carregando configurações visuais...
          </div>
        </div>
      </ChartPaletteContext.Provider>
    );
  }

  return (
    <ChartPaletteContext.Provider value={value}>
      <div style={variaveisCss} className="min-h-screen">
        {children}
      </div>
    </ChartPaletteContext.Provider>
  );
}

export function useChartPalette() {
  const context = useContext(ChartPaletteContext);

  if (!context) {
    throw new Error(
      "useChartPalette deve ser usado dentro de ChartPaletteProvider.",
    );
  }

  return context;
}