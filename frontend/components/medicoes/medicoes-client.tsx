"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  FileSpreadsheet,
  FileText,
  Landmark,
  ReceiptText,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
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
  API_BASE_URL,
  buscarContratos,
  buscarMedicoes,
  exportarMedicoesExcel,
  type Medicao,
  type MedicoesRequestFiltros,
  type MedicoesResponse,
} from "@/lib/api";
import {
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNumero,
} from "@/lib/formatters";

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

function situacaoBadge(situacao: string) {
  const texto = situacao || "Sem situação";

  return (
    <span className="inline-flex items-center border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {texto}
    </span>
  );
}

function MedicoesLoading() {
  return (
    <div className="border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      Carregando medições...
    </div>
  );
}

type MedicaoCardMobileProps = {
  medicao: Medicao;
};

function MedicaoCardMobile({ medicao }: MedicaoCardMobileProps) {
  return (
    <article className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Medição
          </p>
          <h3 className="mt-1 text-base font-black text-slate-950">
            {medicao.numero_medicao || "-"}
          </h3>
        </div>

        {situacaoBadge(medicao.situacao)}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Contrato
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {medicao.numero_contrato || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Mês/Ano
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {medicao.mes_ano || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Medido
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarMoeda(medicao.valor_medido)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Pago
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarMoeda(medicao.valor_pago)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MedicoesClient() {
  const [dados, setDados] = useState<MedicoesResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [erro, setErro] = useState("");

  const [contrato, setContrato] = useState("");
  const [situacao, setSituacao] = useState("");

  const [opcoesContrato, setOpcoesContrato] = useState<SelectOption[]>([]);
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

      setOpcoesSituacao(
        montarOpcoesUnicas(
          medicoesResposta.results.map((item) => item.situacao),
        ),
      );
    } catch {
      setOpcoesContrato([]);
      setOpcoesSituacao([]);
    }
  }, []);

  const carregarMedicoes = useCallback(
    async (filtros: MedicoesRequestFiltros = {}) => {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await buscarMedicoes(filtros);

        setDados(resposta);
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as medições.";

        setErro(mensagem);
        setDados(null);
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
    carregarMedicoes({
      contrato,
      situacao,
    });
  }, [contrato, situacao, carregarMedicoes]);

  function limparFiltros() {
    setContrato("");
    setSituacao("");
  }

  function montarQueryStringAtual() {
    const params = new URLSearchParams();

    if (contrato.trim()) {
      params.set("contrato", contrato.trim());
    }

    if (situacao.trim()) {
      params.set("situacao", situacao.trim());
    }

    const queryString = params.toString();

    return queryString ? `?${queryString}` : "";
  }

  function handleExportarPdf() {
    setErro("");

    const url = `${API_BASE_URL}/relatorios/dashboard/pdf/${montarQueryStringAtual()}`;
    const janela = window.open(url, "_blank", "noopener,noreferrer");

    if (!janela) {
      window.location.href = url;
    }
  }

  async function handleExportarExcel() {
    try {
      setExportandoExcel(true);
      setErro("");

      await exportarMedicoesExcel({
        contrato,
        situacao,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar as medições.";

      setErro(mensagem);
    } finally {
      setExportandoExcel(false);
    }
  }

  const medicoes = dados?.results || [];
  const cards = dados?.cards;
  const evolucaoMensal = dados?.graficos.evolucao_mensal || [];
  const podeExportar = Boolean(dados?.permissions.pode_exportar);

  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Contrato
            </label>

            <select
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
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Situação
            </label>

            <select
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
              className="h-11 w-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 xl:w-auto"
            >
              Limpar
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleExportarPdf}
              disabled={!podeExportar}
              className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleExportarExcel}
              disabled={!podeExportar || exportandoExcel}
              className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportandoExcel ? "Exportando..." : "XLS"}
            </button>
          </div>
        </div>
      </section>

      {erro && (
        <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {erro}
        </div>
      )}

      {carregando && <MedicoesLoading />}

      {!carregando && cards && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Medições"
            value={formatarNumero(cards.total_medicoes)}
            description="Registros encontrados"
            icon={ReceiptText}
          />

          <MetricCard
            label="Medido"
            value={formatarMoeda(cards.total_medido)}
            description="Total medido"
            icon={Landmark}
          />

          <MetricCard
            label="Pago"
            value={formatarMoeda(cards.total_pago)}
            description="Total pago"
            icon={Wallet}
          />

          <MetricCard
            label="Liquidado"
            value={formatarMoeda(cards.total_liquidado)}
            description="Total liquidado"
            icon={Banknote}
          />

          <MetricCard
            label="Faturado"
            value={formatarMoeda(cards.total_faturado)}
            description="Total faturado"
            icon={ReceiptText}
          />

          <MetricCard
            label="A processar"
            value={formatarMoeda(cards.total_a_processar)}
            description="Saldo pendente"
            icon={Banknote}
          />
        </section>
      )}

      {!carregando && (
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-black text-slate-950">
              Evolução mensal das medições
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Valor medido agrupado por mês.
            </p>
          </div>

          <div className="h-[360px] p-5">
            {evolucaoMensal.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolucaoMensal}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes_ano"
                    tick={{
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 12,
                    }}
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
                    dot={{
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Nenhum dado encontrado para montar este gráfico.
              </div>
            )}
          </div>
        </section>
      )}

      {!carregando && (
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">
                Medições cadastradas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {formatarNumero(medicoes.length)}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarMedicoes({
                  contrato,
                  situacao,
                })
              }
              className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          <div className="grid gap-4 p-4 lg:hidden">
            {medicoes.length ? (
              medicoes.map((item) => (
                <MedicaoCardMobile
                  key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}`}
                  medicao={item}
                />
              ))
            ) : (
              <div className="border border-slate-200 bg-white p-5 text-sm text-slate-500">
                Nenhuma medição encontrada.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-4 py-3">Medição</th>
                  <th className="px-4 py-3">Contrato</th>
                  <th className="px-4 py-3">Mês/Ano</th>
                  <th className="px-4 py-3">Medido</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Liquidado</th>
                  <th className="px-4 py-3">Faturado</th>
                  <th className="px-4 py-3">A processar</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Faturamento</th>
                  <th className="px-4 py-3">Situação</th>
                </tr>
              </thead>

              <tbody>
                {medicoes.length ? (
                  medicoes.map((item) => (
                    <tr
                      key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}`}
                      className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-950">
                        {item.numero_medicao || "-"}
                      </td>
                      <td className="px-4 py-3">{item.numero_contrato || "-"}</td>
                      <td className="px-4 py-3">{item.mes_ano || "-"}</td>
                      <td className="px-4 py-3">
                        {formatarMoeda(item.valor_medido)}
                      </td>
                      <td className="px-4 py-3">
                        {formatarMoeda(item.valor_pago)}
                      </td>
                      <td className="px-4 py-3">
                        {formatarMoeda(item.valor_liquidado)}
                      </td>
                      <td className="px-4 py-3">
                        {formatarMoeda(item.valor_faturado)}
                      </td>
                      <td className="px-4 py-3">
                        {formatarMoeda(item.valor_a_processar)}
                      </td>
                      <td className="px-4 py-3">
                        {formatarData(item.data_pagamento)}
                      </td>
                      <td className="px-4 py-3">
                        {formatarData(item.data_faturamento)}
                      </td>
                      <td className="px-4 py-3">
                        {situacaoBadge(item.situacao)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
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