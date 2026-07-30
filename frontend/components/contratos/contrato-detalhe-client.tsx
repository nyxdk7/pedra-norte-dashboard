"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileDown,
  FileSpreadsheet,
  Landmark,
  Percent,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  baixarContratoPdf,
  buscarContratoDetalhe,
  exportarMedicoesExcel,
  type ContratoDetalheResponse,
  type Medicao,
} from "@/lib/api";
import { MetricCard } from "@/components/layout/metric-card";
import {
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNumero,
  formatarPercentual,
} from "@/lib/formatters";

type ContratoDetalheClientProps = {
  numeroContrato: string;
};

function formatarData(data: string | null) {
  if (!data) {
    return "-";
  }

  const partes = data.split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function statusBadge(status: string) {
  const texto = status || "Sem status";
  const normalizado = texto.toLowerCase();

  let classes = "bg-slate-100 text-slate-700";

  if (normalizado.includes("andamento") || normalizado.includes("ativo")) {
    classes = "bg-emerald-50 text-emerald-700";
  }

  if (normalizado.includes("encerrado") || normalizado.includes("finalizado")) {
    classes = "bg-slate-200 text-slate-700";
  }

  if (normalizado.includes("paralisado") || normalizado.includes("suspenso")) {
    classes = "bg-amber-50 text-amber-700";
  }

  if (normalizado.includes("cancelado") || normalizado.includes("rescindido")) {
    classes = "bg-red-50 text-red-700";
  }

  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 text-xs font-semibold",
        classes,
      ].join(" ")}
    >
      {texto}
    </span>
  );
}

function situacaoBadge(situacao: string) {
  const texto = situacao || "Sem situação";

  return (
    <span className="inline-flex bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {texto}
    </span>
  );
}

function DetalheLoading() {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-5 py-8 text-sm font-semibold text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="mr-3 inline-block h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900 align-[-2px]" />
      Carregando detalhe do contrato...
    </div>
  );
}

type MedicaoCardMobileProps = {
  medicao: Medicao;
};

function MedicaoCardMobile({ medicao }: MedicaoCardMobileProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Medição
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-950">
            {medicao.numero_medicao || "-"}
          </h3>
        </div>

        {situacaoBadge(medicao.situacao)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Mês/Ano</p>
          <p className="mt-1 text-slate-800">{medicao.mes_ano || "-"}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Medido</p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarMoeda(medicao.valor_medido)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Pago</p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarMoeda(medicao.valor_pago)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">
            Faturado
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarMoeda(medicao.valor_faturado)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ContratoDetalheClient({
  numeroContrato,
}: ContratoDetalheClientProps) {
  const [dados, setDados] = useState<ContratoDetalheResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [erro, setErro] = useState("");
  const [situacao, setSituacao] = useState("");

  async function carregarDetalhe(situacaoFiltro = "") {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await buscarContratoDetalhe(numeroContrato, {
        situacao: situacaoFiltro,
      });

      setDados(resposta);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o contrato.";

      setErro(mensagem);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDetalhe();
  }, []);

  function aplicarFiltro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    carregarDetalhe(situacao.trim());
  }

  function limparFiltro() {
    setSituacao("");
    carregarDetalhe();
  }

  async function handlePdf() {
    try {
      setExportandoPdf(true);
      setErro("");

      await baixarContratoPdf(numeroContrato);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível baixar o PDF.";

      setErro(mensagem);
    } finally {
      setExportandoPdf(false);
    }
  }

  async function handleExcel() {
    try {
      setExportandoExcel(true);
      setErro("");

      await exportarMedicoesExcel({
        contrato: numeroContrato,
        situacao: situacao.trim(),
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o Excel.";

      setErro(mensagem);
    } finally {
      setExportandoExcel(false);
    }
  }

  const contrato = dados?.contrato;
  const cards = dados?.cards;
  const medicoes = dados?.medicoes || [];
  const evolucaoMensal = dados?.graficos.evolucao_mensal || [];
  const resumoFinanceiro = dados?.graficos.resumo_financeiro || [];
  const podeExportar = Boolean(dados?.permissions.pode_exportar);

  const progresso = cards?.percentual_evolucao || 0;

  const progressoGrafico = [
    {
      nome: "Executado",
      valor: progresso,
    },
    {
      nome: "Restante",
      valor: Math.max(0, 100 - progresso),
    },
  ];

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link
          href="/contratos"
          className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:w-auto"
        >
          <ArrowLeft size={17} />
          Voltar para contratos
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handlePdf}
            disabled={!podeExportar || exportandoPdf}
            className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <Download size={17} />
            {exportandoPdf ? "Gerando PDF..." : "PDF"}
          </button>

          <button
            type="button"
            onClick={handleExcel}
            disabled={!podeExportar || exportandoExcel}
            className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <FileDown size={17} />
            {exportandoExcel ? "Exportando..." : "XLSX"}
          </button>
        </div>
      </div>

      {erro && (
        <section className="border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {erro}
        </section>
      )}

      {carregando && <DetalheLoading />}

      {!carregando && contrato && (
        <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">
              Dados do contrato
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informações gerais cadastradas na base.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Número
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {contrato.numero_contrato || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Empresa
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {contrato.empresa || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Status
              </p>
              <div className="mt-1">{statusBadge(contrato.status)}</div>
            </div>

            <div className="lg:col-span-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Objeto
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {contrato.objeto || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Data início
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatarData(contrato.data_inicio)}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Data fim
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatarData(contrato.data_fim)}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Garantia
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {contrato.garantia || "-"}
              </p>
            </div>
          </div>
        </section>
      )}

      {!carregando && cards && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Valor contratado"
            value={formatarMoeda(cards.total_contratado)}
            description="Valor total do contrato"
            icon={Landmark}
          />

          <MetricCard
            label="Valor medido"
            value={formatarMoeda(cards.total_medido)}
            description="Total medido neste contrato"
            icon={FileSpreadsheet}
          />

          <MetricCard
            label="Valor pago"
            value={formatarMoeda(cards.total_pago)}
            description="Total pago neste contrato"
            icon={Wallet}
          />

          <MetricCard
            label="Faturado"
            value={formatarMoeda(cards.total_faturado)}
            description="Total faturado"
            icon={ReceiptText}
          />

          <MetricCard
            label="Evolução"
            value={formatarPercentual(cards.percentual_evolucao)}
            description="Percentual financeiro executado"
            icon={Percent}
          />
        </section>
      )}

      {!carregando && cards && (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-950">
                Progresso financeiro
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Percentual executado em relação ao valor contratado.
              </p>
            </div>

            <div className="h-80 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressoGrafico}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={105}
                    label={(item) => {
                      const payload = item as unknown as {
                        payload?: {
                          nome?: string;
                          valor?: number;
                        };
                        name?: string | number;
                        value?: string | number;
                      };

                      const nome =
                        payload.payload?.nome ||
                        String(payload.name || "Item");

                      const valor = Number(
                        payload.payload?.valor ?? payload.value ?? 0,
                      );

                      return `${nome}: ${formatarPercentual(valor)}`;
                    }}
                  >
                    <Cell fill="#111827" />
                    <Cell fill="#cbd5e1" />
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      formatarPercentual(Number(value)),
                      "Percentual",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-950">
                Resumo do contrato
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Comparativo financeiro deste contrato.
              </p>
            </div>

            <div className="h-80 px-4 py-5">
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

                  <Bar dataKey="valor" fill="#111827" maxBarSize={58} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {!carregando && (
        <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">
              Evolução mensal do contrato
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Valor medido agrupado por mês.
            </p>
          </div>

          <div className="h-72 px-4 py-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucaoMensal}>
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
                />

                <Bar dataKey="valor_medido" fill="#111827" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {!carregando && (
        <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Medições do contrato
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {formatarNumero(medicoes.length)}
              </p>
            </div>

            <form
              onSubmit={aplicarFiltro}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={situacao}
                onChange={(event) => setSituacao(event.target.value)}
                placeholder="Filtrar situação"
                className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 bg-[#111827] px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Search size={17} />
                Filtrar
              </button>

              <button
                type="button"
                onClick={limparFiltro}
                className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => carregarDetalhe(situacao.trim())}
                className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Atualizar
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {medicoes.length ? (
              medicoes.map((item) => (
                <MedicaoCardMobile
                  key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}`}
                  medicao={item}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Nenhuma medição encontrada.
              </p>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Medição</th>
                  <th className="px-5 py-3">Mês/Ano</th>
                  <th className="px-5 py-3">Medido</th>
                  <th className="px-5 py-3">Pago</th>
                  <th className="px-5 py-3">Liquidado</th>
                  <th className="px-5 py-3">Faturado</th>
                  <th className="px-5 py-3">A processar</th>
                  <th className="px-5 py-3">Pagamento</th>
                  <th className="px-5 py-3">Faturamento</th>
                  <th className="px-5 py-3">Situação</th>
                </tr>
              </thead>

              <tbody>
                {medicoes.length ? (
                  medicoes.map((item) => (
                    <tr
                      key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}`}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-5 py-4 font-bold text-slate-950">
                        {item.numero_medicao || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {item.mes_ano || "-"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarMoeda(item.valor_medido)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarMoeda(item.valor_pago)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarMoeda(item.valor_liquidado)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarMoeda(item.valor_faturado)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarMoeda(item.valor_a_processar)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatarData(item.data_pagamento)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatarData(item.data_faturamento)}
                      </td>

                      <td className="px-5 py-4">
                        {situacaoBadge(item.situacao)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-5 text-slate-400" colSpan={10}>
                      Nenhuma medição encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}