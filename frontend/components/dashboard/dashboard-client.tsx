"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  Landmark,
  Percent,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "@/components/layout/metric-card";
import {
  buscarContratos,
  buscarDashboard,
  buscarMedicoes,
  type DashboardRequestFiltros,
  type DashboardResponse,
} from "@/lib/api";
import {
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNumero,
  formatarPercentual,
} from "@/lib/formatters";

const CHART_COLORS = [
  "#111827",
  "#334155",
  "#475569",
  "#64748b",
  "#1e3a8a",
  "#1d4ed8",
  "#0369a1",
  "#0f766e",
];

type SelectOption = {
  value: string;
  label: string;
};

function montarOpcoesUnicas(valores: string[], prefixo = "") {
  const unicos = Array.from(
    new Set(
      valores
        .map((valor) => String(valor || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

  return unicos.map((valor) => ({
    value: valor,
    label: prefixo ? `${prefixo} ${valor}` : valor,
  }));
}

function DashboardLoadingCards() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="h-[156px] animate-pulse border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-32 bg-slate-200" />
          <div className="mt-7 h-8 w-40 bg-slate-200" />
          <div className="mt-5 h-3 w-full bg-slate-100" />
          <div className="mt-2 h-3 w-2/3 bg-slate-100" />
        </div>
      ))}
    </section>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-72 items-center justify-center px-5 py-6 text-sm text-slate-400">
      Nenhum dado encontrado para montar este gráfico.
    </div>
  );
}

function ChartLoadingState() {
  return (
    <div className="flex h-72 items-center justify-center px-5 py-6 text-sm font-semibold text-slate-500">
      <span className="mr-3 h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900" />
      Carregando gráfico...
    </div>
  );
}

type ChartCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

export function DashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [contrato, setContrato] = useState("");
  const [status, setStatus] = useState("");
  const [situacao, setSituacao] = useState("");

  const [opcoesContrato, setOpcoesContrato] = useState<SelectOption[]>([]);
  const [opcoesStatus, setOpcoesStatus] = useState<SelectOption[]>([]);
  const [opcoesSituacao, setOpcoesSituacao] = useState<SelectOption[]>([]);

  const carregarOpcoesFiltros = useCallback(async () => {
    try {
      const [contratosResposta, medicoesResposta] = await Promise.all([
        buscarContratos(),
        buscarMedicoes(),
      ]);

      setOpcoesContrato(
        montarOpcoesUnicas(
          contratosResposta.results.map((item) => item.numero_contrato),
          "CT",
        ),
      );

      setOpcoesStatus(
        montarOpcoesUnicas(
          contratosResposta.results.map((item) => item.status),
        ),
      );

      setOpcoesSituacao(
        montarOpcoesUnicas(
          medicoesResposta.results.map((item) => item.situacao),
        ),
      );
    } catch {
      setOpcoesContrato([]);
      setOpcoesStatus([]);
      setOpcoesSituacao([]);
    }
  }, []);

  const carregarDashboard = useCallback(
    async (filtros: DashboardRequestFiltros = {}) => {
      try {
        setCarregando(true);
        setErro("");

        const dados = await buscarDashboard(filtros);

        setDashboard(dados);
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard.";

        setErro(mensagem);
        setDashboard(null);
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  useEffect(() => {
    carregarOpcoesFiltros();
  }, [carregarOpcoesFiltros]);

  useEffect(() => {
    carregarDashboard({
      contrato,
      status,
      situacao,
    });
  }, [contrato, status, situacao, carregarDashboard]);

  function limparFiltros() {
    setContrato("");
    setStatus("");
    setSituacao("");
  }

  const cards = dashboard?.cards;

  const evolucaoMensal = dashboard?.graficos.evolucao_mensal || [];
  const resumoFinanceiro = dashboard?.graficos.resumo_financeiro || [];
  const contratadoMedido = dashboard?.graficos.contratado_x_medido || [];
  const rankingEvolucao = dashboard?.graficos.ranking_evolucao || [];
  const contratosPorStatus = dashboard?.graficos.contratos_por_status || [];
  const medicoesPorSituacao = dashboard?.graficos.medicoes_por_situacao || [];

  const rankingLimitado = rankingEvolucao.slice(0, 8);

  return (
    <div className="space-y-6 px-5 py-6 lg:px-8">
      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label
              htmlFor="contrato"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              Contrato
            </label>

            <select
              id="contrato"
              value={contrato}
              onChange={(event) => setContrato(event.target.value)}
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os contratos</option>

              {opcoesContrato.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os status</option>

              {opcoesStatus.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="situacao"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              Situação
            </label>

            <select
              id="situacao"
              value={situacao}
              onChange={(event) => setSituacao(event.target.value)}
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todas as situações</option>

              {opcoesSituacao.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:w-auto"
            >
              Limpar
            </button>
          </div>
        </div>
      </section>

      {erro && (
        <section className="border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {erro}
        </section>
      )}

      {carregando && <DashboardLoadingCards />}

      {!carregando && cards && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total contratado"
            value={formatarMoeda(cards.total_contratado)}
            description="Valor total dos contratos cadastrados"
            icon={Landmark}
          />

          <MetricCard
            label="Total medido"
            value={formatarMoeda(cards.total_medido)}
            description="Soma das medições lançadas no sistema"
            icon={BarChart3}
          />

          <MetricCard
            label="Total pago"
            value={formatarMoeda(cards.total_pago)}
            description="Pagamentos identificados nas medições"
            icon={Wallet}
          />

          <MetricCard
            label="Saldo estimado"
            value={formatarMoeda(cards.saldo_estimado)}
            description="Diferença entre contratado e medido"
            icon={BriefcaseBusiness}
          />

          <MetricCard
            label="Total faturado"
            value={formatarMoeda(cards.total_faturado)}
            description="Valor faturado no período filtrado"
            icon={FileCheck2}
          />

          <MetricCard
            label="A processar"
            value={formatarMoeda(cards.total_a_processar)}
            description="Medições pendentes de processamento"
            icon={FileSpreadsheet}
          />

          <MetricCard
            label="Contratos"
            value={formatarNumero(cards.total_contratos)}
            description="Quantidade de contratos monitorados"
            icon={ClipboardList}
          />

          <MetricCard
            label="Medições"
            value={formatarNumero(cards.total_medicoes)}
            description="Quantidade de medições importadas"
            icon={FileSpreadsheet}
          />

          <MetricCard
            label="Evolução"
            value={formatarPercentual(cards.percentual_evolucao)}
            description="Percentual financeiro executado"
            icon={Percent}
          />
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Evolução mensal"
          subtitle="Valor medido agrupado por mês."
        >
          {carregando ? (
            <ChartLoadingState />
          ) : evolucaoMensal.length ? (
            <div className="h-72 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="mes_ano"
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                    tickFormatter={(value) => formatarMoedaCompacta(value)}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatarMoeda(Number(value)),
                      "Valor medido",
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor_medido"
                    stroke="#111827"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#111827", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="Resumo financeiro"
          subtitle="Comparativo entre contratado, medido, pago, faturado e a processar."
        >
          {carregando ? (
            <ChartLoadingState />
          ) : resumoFinanceiro.length ? (
            <div className="h-72 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumoFinanceiro}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                    tickFormatter={(value) => formatarMoedaCompacta(value)}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatarMoeda(Number(value)),
                      "Valor",
                    ]}
                  />
                  <Bar
                    dataKey="valor"
                    fill="#111827"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={58}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Contratado x medido por contrato"
          subtitle="Comparativo financeiro entre valor contratado e valor medido."
        >
          {carregando ? (
            <ChartLoadingState />
          ) : contratadoMedido.length ? (
            <div className="h-80 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contratadoMedido}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="numero_contrato"
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                    tickFormatter={(value) => formatarMoedaCompacta(value)}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatarMoeda(Number(value)),
                      name === "valor_contratado"
                        ? "Valor contratado"
                        : "Valor medido",
                    ]}
                    labelFormatter={(label) => `Contrato: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="valor_contratado"
                    name="Contratado"
                    fill="#111827"
                    maxBarSize={42}
                  />
                  <Bar
                    dataKey="valor_medido"
                    name="Medido"
                    fill="#475569"
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="Ranking de evolução"
          subtitle="Contratos com maior percentual financeiro executado."
        >
          {carregando ? (
            <ChartLoadingState />
          ) : rankingLimitado.length ? (
            <div className="h-80 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rankingLimitado}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 25,
                    left: 25,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="numero_contrato"
                    width={95}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatarPercentual(Number(value)),
                      "Execução",
                    ]}
                    labelFormatter={(label) => `Contrato: ${label}`}
                  />
                  <Bar
                    dataKey="percentual_executado"
                    fill="#111827"
                    maxBarSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Contratos por status"
          subtitle="Distribuição dos contratos conforme o status cadastrado."
        >
          {carregando ? (
            <ChartLoadingState />
          ) : contratosPorStatus.length ? (
            <div className="h-80 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contratosPorStatus}
                    dataKey="total"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(item) => `${item.status}: ${item.total}`}
                  >
                    {contratosPorStatus.map((_, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatarNumero(Number(value)),
                      "Contratos",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="Medições por situação"
          subtitle="Distribuição das medições conforme a situação atual."
        >
          {carregando ? (
            <ChartLoadingState />
          ) : medicoesPorSituacao.length ? (
            <div className="h-80 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicoesPorSituacao}
                    dataKey="total"
                    nameKey="situacao"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(item) => `${item.situacao}: ${item.total}`}
                  >
                    {medicoesPorSituacao.map((_, index) => (
                      <Cell
                        key={`situacao-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatarNumero(Number(value)),
                      "Medições",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </ChartCard>
      </section>

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Status da conexão
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Dados carregados diretamente da API Django.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              carregarDashboard({
                contrato,
                status,
                situacao,
              })
            }
            className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Recarregar
          </button>
        </div>

        <div className="px-5 py-5 text-sm text-slate-600">
          {dashboard ? (
            <p>
              API conectada. Foram encontrados{" "}
              <strong>{formatarNumero(dashboard.cards.total_contratos)}</strong>{" "}
              contratos e{" "}
              <strong>{formatarNumero(dashboard.cards.total_medicoes)}</strong>{" "}
              medições.
            </p>
          ) : (
            <p>Nenhum dado carregado no momento.</p>
          )}
        </div>
      </section>
    </div>
  );
}