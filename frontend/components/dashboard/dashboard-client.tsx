"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  Landmark,
  Percent,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "@/components/layout/metric-card";
import {
  buscarDashboard,
  type DashboardRequestFiltros,
  type DashboardResponse,
} from "@/lib/api";
import {
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNumero,
  formatarPercentual,
} from "@/lib/formatters";

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

export function DashboardClient() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [contrato, setContrato] = useState("");
  const [status, setStatus] = useState("");
  const [situacao, setSituacao] = useState("");

  async function carregarDashboard(filtros: DashboardRequestFiltros = {}) {
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
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    carregarDashboard({
      contrato: contrato.trim(),
      status: status.trim(),
      situacao: situacao.trim(),
    });
  }

  function limparFiltros() {
    setContrato("");
    setStatus("");
    setSituacao("");

    carregarDashboard();
  }

  const cards = dashboard?.cards;
  const evolucaoMensal = dashboard?.graficos.evolucao_mensal || [];
  const resumoFinanceiro = dashboard?.graficos.resumo_financeiro || [];

  return (
    <div className="space-y-6 px-5 py-6 lg:px-8">
      <section className="border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={aplicarFiltros}
          className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
        >
          <div>
            <label
              htmlFor="contrato"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              Contrato
            </label>
            <input
              id="contrato"
              value={contrato}
              onChange={(event) => setContrato(event.target.value)}
              placeholder="Ex: 001/2024"
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              Status
            </label>
            <input
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              placeholder="Ex: Ativo"
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="situacao"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              Situação
            </label>
            <input
              id="situacao"
              value={situacao}
              onChange={(event) => setSituacao(event.target.value)}
              placeholder="Ex: Pago"
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
            >
              <Search size={17} />
              Filtrar
            </button>
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
        </form>
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
        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">
              Evolução mensal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Valor medido agrupado por mês.
            </p>
          </div>

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
                    stroke="#0f172a"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0f172a", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </div>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">
              Resumo financeiro
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Comparativo entre contratado, medido, pago, faturado e a processar.
            </p>
          </div>

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
                    fill="#0f172a"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={58}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </div>
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
                contrato: contrato.trim(),
                status: status.trim(),
                situacao: situacao.trim(),
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