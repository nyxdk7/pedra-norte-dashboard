"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Banknote,
  FileDown,
  FileSpreadsheet,
  Landmark,
  ReceiptText,
  RefreshCw,
  Search,
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
    <span className="inline-flex border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {texto}
    </span>
  );
}

function MedicoesLoading() {
  return (
    <div className="border border-slate-200 bg-white px-5 py-8 text-sm font-semibold text-slate-500 shadow-sm">
      <span className="mr-3 inline-block h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900 align-[-2px]" />
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
          <p className="text-xs font-bold uppercase text-slate-400">
            Contrato
          </p>
          <p className="mt-1 text-slate-800">
            {medicao.numero_contrato || "-"}
          </p>
        </div>

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
      </div>
    </article>
  );
}

export function MedicoesClient() {
  const [dados, setDados] = useState<MedicoesResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState("");

  const [contrato, setContrato] = useState("");
  const [situacao, setSituacao] = useState("");

  async function carregarMedicoes(filtros: MedicoesRequestFiltros = {}) {
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
  }

  useEffect(() => {
    carregarMedicoes();
  }, []);

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    carregarMedicoes({
      contrato: contrato.trim(),
      situacao: situacao.trim(),
    });
  }

  function limparFiltros() {
    setContrato("");
    setSituacao("");

    carregarMedicoes();
  }

  async function handleExportar() {
    try {
      setExportando(true);
      setErro("");

      await exportarMedicoesExcel({
        contrato: contrato.trim(),
        situacao: situacao.trim(),
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar as medições.";

      setErro(mensagem);
    } finally {
      setExportando(false);
    }
  }

  const medicoes = dados?.results || [];
  const cards = dados?.cards;
  const evolucaoMensal = dados?.graficos.evolucao_mensal || [];
  const podeExportar = Boolean(dados?.permissions.pode_exportar);

  return (
    <div className="space-y-6 px-5 py-6 lg:px-8">
      <section className="border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={aplicarFiltros}
          className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[1fr_1fr_auto_auto_auto]"
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

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleExportar}
              disabled={!podeExportar || exportando}
              className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 md:w-auto"
            >
              <FileDown size={17} />
              {exportando ? "Exportando..." : "Exportar"}
            </button>
          </div>
        </form>
      </section>

      {erro && (
        <section className="border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {erro}
        </section>
      )}

      {carregando && <MedicoesLoading />}

      {!carregando && cards && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Medições"
            value={formatarNumero(cards.total_medicoes)}
            description="Registros encontrados"
            icon={FileSpreadsheet}
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
            <h2 className="text-base font-bold text-slate-950">
              Evolução mensal das medições
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Valor medido agrupado por mês.
            </p>
          </div>

          {evolucaoMensal.length ? (
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
            <div className="flex h-72 items-center justify-center px-5 py-6 text-sm text-slate-400">
              Nenhum dado encontrado para montar este gráfico.
            </div>
          )}
        </section>
      )}

      {!carregando && (
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
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
                  contrato: contrato.trim(),
                  situacao: situacao.trim(),
                })
              }
              className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Atualizar
            </button>
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
                  <th className="px-5 py-3">Contrato</th>
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
                        {item.numero_contrato || "-"}
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
                    <td className="px-5 py-5 text-slate-400" colSpan={11}>
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