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
  const params = new URLSearchParams();

  if (filtros.contrato) {
    params.set("contrato", filtros.contrato);
  }

  if (filtros.status) {
    params.set("status", filtros.status);
  }

  if (filtros.situacao) {
    params.set("situacao", filtros.situacao);
  }

  const queryString = params.toString();
  const path = queryString ? `/dashboard/?${queryString}` : "/dashboard/";

  return apiRequest<DashboardResponse>(path);
}