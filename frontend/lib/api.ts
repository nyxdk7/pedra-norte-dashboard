export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
};

type ApiErrorData = {
  detail?: string;
  mensagem?: string;
  message?: string;
  erro?: string;
};

function montarQueryString(filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor && valor.trim()) {
      params.set(chave, valor.trim());
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown = null;

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorData = data as ApiErrorData | null;

    const message =
      errorData?.detail ||
      errorData?.mensagem ||
      errorData?.message ||
      errorData?.erro ||
      "Não foi possível concluir a solicitação.";

    throw new Error(message);
  }

  return data as T;
}

export async function baixarArquivo(path: string, nomeArquivo: string) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = (await response.json()) as ApiErrorData;

      throw new Error(
        data.detail ||
          data.mensagem ||
          data.message ||
          data.erro ||
          "Não foi possível baixar o arquivo.",
      );
    }

    throw new Error("Não foi possível baixar o arquivo.");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
}

export type UsuarioPermissoes = {
  grupos: string[];
  is_superuser: boolean;
  pode_visualizar?: boolean;
  pode_exportar: boolean;
  pode_ver_historico: boolean;
  pode_sincronizar: boolean;
};

export type UsuarioLogado = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  permissions: UsuarioPermissoes;
};

export type LoginResponse = {
  detail: string;
  user: UsuarioLogado;
};

export type DashboardCards = {
  total_contratado: number;
  total_medido: number;
  total_pago: number;
  total_liquidado: number;
  total_faturado: number;
  total_a_processar: number;
  saldo_estimado: number;
  percentual_evolucao: number;
  total_contratos: number;
  total_medicoes: number;
};

export type GraficoEvolucaoMensalItem = {
  mes_ano: string;
  valor_medido: number;
};

export type GraficoResumoFinanceiroItem = {
  nome: string;
  valor: number;
};

export type GraficoContratadoMedidoItem = {
  numero_contrato: string;
  empresa: string;
  valor_contratado: number;
  valor_medido: number;
  percentual_executado: number;
};

export type GraficoContratosPorStatusItem = {
  status: string;
  total: number;
};

export type GraficoMedicoesPorSituacaoItem = {
  situacao: string;
  total: number;
};

export type DashboardGraficos = {
  evolucao_mensal: GraficoEvolucaoMensalItem[];
  resumo_financeiro: GraficoResumoFinanceiroItem[];
  contratado_x_medido: GraficoContratadoMedidoItem[];
  ranking_evolucao: GraficoContratadoMedidoItem[];
  contratos_por_status: GraficoContratosPorStatusItem[];
  medicoes_por_situacao: GraficoMedicoesPorSituacaoItem[];
};

export type DashboardFiltros = {
  contrato: string;
  status: string;
  situacao: string;
};

export type DashboardResponse = {
  cards: DashboardCards;
  graficos: DashboardGraficos;
  filtros: DashboardFiltros;
  permissions: UsuarioPermissoes;
};

export type DashboardRequestFiltros = {
  contrato?: string;
  status?: string;
  situacao?: string;
};

export type Contrato = {
  numero_contrato: string;
  empresa: string;
  objeto: string;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
  garantia: string;
  valor_contratual: string;
  valor_total: string;
  percentual_executado: string;
};

export type ContratosCards = {
  total_contratos: number;
  total_contratado: number;
  total_medido: number;
  saldo_estimado: number;
  percentual_evolucao: number;
};

export type ContratosResponse = {
  results: Contrato[];
  cards: ContratosCards;
  permissions: UsuarioPermissoes;
};

export type ContratosRequestFiltros = {
  contrato?: string;
  status?: string;
};

export type Medicao = {
  numero_medicao: string;
  numero_contrato: string;
  mes_ano: string;
  valor_medido: string;
  valor_pago: string;
  data_pagamento: string | null;
  valor_liquidado: string;
  valor_faturado: string;
  data_faturamento: string | null;
  valor_a_processar: string;
  situacao: string;
};

export type MedicoesCards = {
  total_medicoes: number;
  total_medido: number;
  total_pago: number;
  total_liquidado: number;
  total_faturado: number;
  total_a_processar: number;
};

export type MedicoesResponse = {
  results: Medicao[];
  cards: MedicoesCards;
  graficos: {
    evolucao_mensal: GraficoEvolucaoMensalItem[];
  };
  permissions: UsuarioPermissoes;
};

export type MedicoesRequestFiltros = {
  contrato?: string;
  situacao?: string;
};

export async function loginUsuario(username: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: {
      username,
      password,
    },
  });
}

export async function buscarUsuarioLogado() {
  return apiRequest<UsuarioLogado>("/auth/me/");
}

export async function logoutUsuario() {
  return apiRequest<{ detail: string }>("/auth/logout/", {
    method: "POST",
  });
}

export async function buscarDashboard(filtros: DashboardRequestFiltros = {}) {
  const queryString = montarQueryString({
    contrato: filtros.contrato,
    status: filtros.status,
    situacao: filtros.situacao,
  });

  return apiRequest<DashboardResponse>(`/dashboard/${queryString}`);
}

export async function buscarContratos(filtros: ContratosRequestFiltros = {}) {
  const queryString = montarQueryString({
    contrato: filtros.contrato,
    status: filtros.status,
  });

  return apiRequest<ContratosResponse>(`/contratos/${queryString}`);
}

export async function buscarMedicoes(filtros: MedicoesRequestFiltros = {}) {
  const queryString = montarQueryString({
    contrato: filtros.contrato,
    situacao: filtros.situacao,
  });

  return apiRequest<MedicoesResponse>(`/medicoes/${queryString}`);
}

export async function exportarContratosExcel(
  filtros: ContratosRequestFiltros = {},
) {
  const queryString = montarQueryString({
    contrato: filtros.contrato,
    status: filtros.status,
  });

  return baixarArquivo(
    `/exportar/contratos/excel/${queryString}`,
    "contratos_pedra_norte.xlsx",
  );
}

export async function exportarMedicoesExcel(
  filtros: MedicoesRequestFiltros = {},
) {
  const queryString = montarQueryString({
    contrato: filtros.contrato,
    situacao: filtros.situacao,
  });

  return baixarArquivo(
    `/exportar/medicoes/excel/${queryString}`,
    "medicoes_pedra_norte.xlsx",
  );
}