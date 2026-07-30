"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
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

import { useChartPalette } from "@/components/configuracoes/chart-palette-provider";
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

type SelectOption = { value: string; label: string };

function montarOpcoesUnicas(valores: string[], prefixo = "") {
  const unicos = Array.from(
    new Set(valores.map((valor) => String(valor || "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

  return unicos.map((valor) => ({
    value: valor,
    label: prefixo ? `${prefixo} ${valor}` : valor,
  }));
}

function DashboardLoadingCards() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-[104px] animate-pulse rounded-md border border-slate-200 bg-white p-4"
        >
          <div className="h-2.5 w-24 rounded bg-slate-200" />
          <div className="mt-4 h-6 w-40 rounded bg-slate-200" />
          <div className="mt-3 h-2.5 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </section>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-64 items-center justify-center px-5 text-sm text-slate-400">
      Nenhum dado disponível para este gráfico.
    </div>
  );
}

function ChartLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      Carregando dados...
    </div>
  );
}

type ChartCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-4 py-3.5">
        <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

const selectClass =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function DashboardClient() {
  const { palette } = useChartPalette();
  const cores = palette.cores;

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
        montarOpcoesUnicas(contratosResposta.results.map((item) => item.status)),
      );
      setOpcoesSituacao(
        montarOpcoesUnicas(medicoesResposta.results.map((item) => item.situacao)),
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
        setDashboard(await buscarDashboard(filtros));
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard.",
        );
        setDashboard(null);
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => void carregarOpcoesFiltros(), 0);
    return () => window.clearTimeout(timeout);
  }, [carregarOpcoesFiltros]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void carregarDashboard({ contrato, status, situacao }),
      0,
    );
    return () => window.clearTimeout(timeout);
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
  const rankingLimitado = (dashboard?.graficos.ranking_evolucao || []).slice(0, 8);
  const contratosPorStatus = dashboard?.graficos.contratos_por_status || [];
  const medicoesPorSituacao = dashboard?.graficos.medicoes_por_situacao || [];

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-7">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
              Contrato
            </label>
            <select value={contrato} onChange={(e) => setContrato(e.target.value)} className={selectClass}>
              <option value="">Todos os contratos</option>
              {opcoesContrato.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
              Status
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="">Todos os status</option>
              {opcoesStatus.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
              Situação
            </label>
            <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className={selectClass}>
              <option value="">Todas as situações</option>
              {opcoesSituacao.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-4 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 md:w-auto"
            >
              Limpar
            </button>
          </div>
        </div>
      </section>

      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {erro}
        </div>
      )}

      {carregando && <DashboardLoadingCards />}

      {!carregando && cards && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total contratado" value={formatarMoeda(cards.total_contratado)} description="Valor dos contratos" icon={Landmark} />
          <MetricCard label="Total medido" value={formatarMoeda(cards.total_medido)} description="Medições registradas" icon={BarChart3} />
          <MetricCard label="Total pago" value={formatarMoeda(cards.total_pago)} description="Pagamentos identificados" icon={Wallet} />
          <MetricCard label="Saldo estimado" value={formatarMoeda(cards.saldo_estimado)} description="Contratado menos medido" icon={BriefcaseBusiness} />
          <MetricCard label="Total faturado" value={formatarMoeda(cards.total_faturado)} description="Faturamento acumulado" icon={FileCheck2} />
          <MetricCard label="A processar" value={formatarMoeda(cards.total_a_processar)} description="Valor ainda pendente" icon={FileSpreadsheet} />
          <MetricCard label="Contratos" value={formatarNumero(cards.total_contratos)} description="Contratos monitorados" icon={ClipboardList} />
          <MetricCard label="Medições" value={formatarNumero(cards.total_medicoes)} description={`${formatarPercentual(cards.percentual_evolucao)} executado`} icon={Percent} />
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Evolução mensal" subtitle="Valor medido por período">
          {carregando ? <ChartLoadingState /> : evolucaoMensal.length ? (
            <div className="h-64 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoMensal} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} />
                  <XAxis dataKey="mes_ano" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatarMoedaCompacta(value)} width={64} />
                  <Tooltip formatter={(value) => [formatarMoeda(Number(value)), "Valor medido"]} labelFormatter={(label) => `Período: ${label}`} />
                  <Line type="monotone" dataKey="valor_medido" stroke={cores[0] || "#2f80ed"} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmptyState />}
        </ChartCard>

        <ChartCard title="Resumo financeiro" subtitle="Comparação entre os principais valores">
          {carregando ? <ChartLoadingState /> : resumoFinanceiro.length ? (
            <div className="h-64 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumoFinanceiro} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatarMoedaCompacta(value)} width={64} />
                  <Tooltip formatter={(value) => [formatarMoeda(Number(value)), "Valor"]} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={38}>
                    {resumoFinanceiro.map((_, index) => (
                      <Cell key={index} fill={cores[index % cores.length] || "#2f80ed"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmptyState />}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Contratado x medido" subtitle="Comparativo por contrato">
          {carregando ? <ChartLoadingState /> : contratadoMedido.length ? (
            <div className="h-72 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contratadoMedido} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} />
                  <XAxis dataKey="numero_contrato" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatarMoedaCompacta(value)} width={64} />
                  <Tooltip formatter={(value, name) => [formatarMoeda(Number(value)), name === "valor_contratado" ? "Contratado" : "Medido"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="valor_contratado" name="Contratado" fill={cores[0] || "#2f80ed"} radius={[3, 3, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="valor_medido" name="Medido" fill={cores[1] || "#56b4d3"} radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmptyState />}
        </ChartCard>

        <ChartCard title="Ranking de evolução" subtitle="Contratos com maior execução financeira">
          {carregando ? <ChartLoadingState /> : rankingLimitado.length ? (
            <div className="h-72 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingLimitado} layout="vertical" margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="numero_contrato" width={82} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [formatarPercentual(Number(value)), "Execução"]} />
                  <Bar dataKey="percentual_executado" fill={cores[2] || "#3ba272"} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmptyState />}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {[
          { title: "Contratos por status", subtitle: "Distribuição atual dos contratos", data: contratosPorStatus, key: "status", label: "Contratos" },
          { title: "Medições por situação", subtitle: "Etapa atual das medições", data: medicoesPorSituacao, key: "situacao", label: "Medições" },
        ].map((grafico) => (
          <ChartCard key={grafico.title} title={grafico.title} subtitle={grafico.subtitle}>
            {carregando ? <ChartLoadingState /> : grafico.data.length ? (
              <div className="h-64 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={grafico.data} dataKey="total" nameKey={grafico.key} innerRadius={55} outerRadius={82} paddingAngle={2}>
                      {grafico.data.map((_, index) => (
                        <Cell key={index} fill={cores[index % cores.length] || "#2f80ed"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatarNumero(Number(value)), grafico.label]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <ChartEmptyState />}
          </ChartCard>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-slate-500">
          {dashboard
            ? `${formatarNumero(dashboard.cards.total_contratos)} contratos e ${formatarNumero(dashboard.cards.total_medicoes)} medições carregados.`
            : "Nenhum dado carregado no momento."}
        </p>
        <button
          type="button"
          onClick={() => carregarDashboard({ contrato, status, situacao })}
          className="flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Recarregar
        </button>
      </section>
    </div>
  );
}
