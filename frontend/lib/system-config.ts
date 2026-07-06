import { apiRequest } from "@/lib/api";
import type { ChartPaletteId } from "@/lib/chart-palettes";

export type ConfiguracaoSistemaResponse = {
  paleta_graficos: ChartPaletteId;
  atualizado_em: string | null;
};

export type SalvarConfiguracaoSistemaResponse = {
  detail: string;
  configuracao: ConfiguracaoSistemaResponse;
};

export async function buscarConfiguracaoSistema() {
  return apiRequest<ConfiguracaoSistemaResponse>("/configuracoes/sistema/");
}

export async function salvarConfiguracaoSistema(paletaGraficos: ChartPaletteId) {
  return apiRequest<SalvarConfiguracaoSistemaResponse>(
    "/configuracoes/sistema/",
    {
      method: "POST",
      body: {
        paleta_graficos: paletaGraficos,
      },
    },
  );
}