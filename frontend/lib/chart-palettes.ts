export type ChartPaletteId =
  | "msm-industrial"
  | "azul-corporativo"
  | "verde-engenharia"
  | "cinza-tecnico"
  | "alto-contraste";

export type ChartPalette = {
  id: ChartPaletteId;
  nome: string;
  descricao: string;
  cores: string[];
};

export const CHART_PALETTE_STORAGE_KEY = "msm_industrial_chart_palette";

export const CHART_PALETTES: ChartPalette[] = [
  {
    id: "msm-industrial",
    nome: "MSM Industrial",
    descricao: "Azul corporativo com cores auxiliares equilibradas.",
    cores: [
      "#2f80ed",
      "#56b4d3",
      "#3ba272",
      "#f2a93b",
      "#7b61ff",
      "#e76f51",
      "#64748b",
      "#14b8a6",
    ],
  },
  {
    id: "azul-corporativo",
    nome: "Azul corporativo",
    descricao: "Tons de azul limpos para relatórios administrativos.",
    cores: [
      "#1f5fae",
      "#2f80ed",
      "#4c9aff",
      "#56b4d3",
      "#3c78a8",
      "#6b8fb3",
      "#7b61ff",
      "#64748b",
    ],
  },
  {
    id: "verde-engenharia",
    nome: "Verde engenharia",
    descricao: "Verdes e azuis suaves para acompanhamento operacional.",
    cores: [
      "#2e7d32",
      "#3ba272",
      "#5aae61",
      "#14b8a6",
      "#56b4d3",
      "#2f80ed",
      "#8aa16f",
      "#64748b",
    ],
  },
  {
    id: "cinza-tecnico",
    nome: "Cinza técnico",
    descricao: "Paleta neutra para leitura documental e técnica.",
    cores: [
      "#475569",
      "#64748b",
      "#7c8798",
      "#94a3b8",
      "#5f7590",
      "#78909c",
      "#a0aec0",
      "#334155",
    ],
  },
  {
    id: "alto-contraste",
    nome: "Alto contraste",
    descricao: "Cores distintas para projetores e apresentações.",
    cores: [
      "#2563eb",
      "#16a34a",
      "#d97706",
      "#7c3aed",
      "#dc2626",
      "#0891b2",
      "#ea580c",
      "#475569",
    ],
  },
];

export function getDefaultChartPalette() {
  return CHART_PALETTES[0];
}

export function getChartPaletteById(id: string | null | undefined) {
  return CHART_PALETTES.find((palette) => palette.id === id) || getDefaultChartPalette();
}

export function getStoredChartPalette() {
  if (typeof window === "undefined") return getDefaultChartPalette();
  return getChartPaletteById(window.localStorage.getItem(CHART_PALETTE_STORAGE_KEY));
}

export function setStoredChartPalette(id: ChartPaletteId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHART_PALETTE_STORAGE_KEY, id);
  window.dispatchEvent(
    new CustomEvent("msm-industrial-chart-palette-changed", {
      detail: { paletteId: id },
    }),
  );
}
