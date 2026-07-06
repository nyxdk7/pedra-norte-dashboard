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
    descricao: "Paleta principal, sóbria e institucional.",
    cores: [
      "#111827",
      "#334155",
      "#475569",
      "#64748b",
      "#1e3a8a",
      "#1d4ed8",
      "#0369a1",
      "#0f766e",
    ],
  },
  {
    id: "azul-corporativo",
    nome: "Azul corporativo",
    descricao: "Mais limpa, moderna e com foco administrativo.",
    cores: [
      "#0f172a",
      "#1e3a8a",
      "#1d4ed8",
      "#2563eb",
      "#0284c7",
      "#0369a1",
      "#075985",
      "#334155",
    ],
  },
  {
    id: "verde-engenharia",
    nome: "Verde engenharia",
    descricao: "Boa para obras, produção e leitura operacional.",
    cores: [
      "#064e3b",
      "#065f46",
      "#047857",
      "#059669",
      "#0f766e",
      "#0d9488",
      "#334155",
      "#475569",
    ],
  },
  {
    id: "cinza-tecnico",
    nome: "Cinza técnico",
    descricao: "Visual neutro, discreto e mais documental.",
    cores: [
      "#020617",
      "#111827",
      "#1f2937",
      "#374151",
      "#4b5563",
      "#64748b",
      "#94a3b8",
      "#475569",
    ],
  },
  {
    id: "alto-contraste",
    nome: "Alto contraste",
    descricao: "Cores mais fortes para apresentação e projetor.",
    cores: [
      "#111827",
      "#dc2626",
      "#2563eb",
      "#16a34a",
      "#ca8a04",
      "#9333ea",
      "#0891b2",
      "#ea580c",
    ],
  },
];

export function getDefaultChartPalette() {
  return CHART_PALETTES[0];
}

export function getChartPaletteById(id: string | null | undefined) {
  return (
    CHART_PALETTES.find((palette) => palette.id === id) ||
    getDefaultChartPalette()
  );
}

export function getStoredChartPalette() {
  if (typeof window === "undefined") {
    return getDefaultChartPalette();
  }

  const storedPaletteId = window.localStorage.getItem(
    CHART_PALETTE_STORAGE_KEY,
  );

  return getChartPaletteById(storedPaletteId);
}

export function setStoredChartPalette(id: ChartPaletteId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CHART_PALETTE_STORAGE_KEY, id);

  window.dispatchEvent(
    new CustomEvent("msm-industrial-chart-palette-changed", {
      detail: {
        paletteId: id,
      },
    }),
  );
}