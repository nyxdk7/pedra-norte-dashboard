"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ClipboardList,
  ExternalLink,
  FileDown,
  Landmark,
  Percent,
  RefreshCw,
  Search,
} from "lucide-react";

import { MetricCard } from "@/components/layout/metric-card";
import {
  buscarContratos,
  exportarContratosExcel,
  type Contrato,
  type ContratosRequestFiltros,
  type ContratosResponse,
} from "@/lib/api";
import {
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
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

function ContratosLoading() {
  return (
    <div className="border border-slate-200 bg-white px-5 py-8 text-sm font-semibold text-slate-500 shadow-sm">
      <span className="mr-3 inline-block h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900 align-[-2px]" />
      Carregando contratos...
    </div>
  );
}

type ContratoCardMobileProps = {
  contrato: Contrato;
};

function ContratoCardMobile({ contrato }: ContratoCardMobileProps) {
  return (
    <article className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Contrato
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-950">
            {contrato.numero_contrato || "-"}
          </h3>
        </div>

        {statusBadge(contrato.status)}
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Empresa</p>
          <p className="mt-1 text-slate-800">{contrato.empresa || "-"}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Valor</p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarMoeda(contrato.valor_total)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">
            Execução
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarPercentual(contrato.percentual_executado)}
          </p>
        </div>
      </div>

      <Link
        href={`/contratos/${encodeURIComponent(contrato.numero_contrato)}`}
        className="mt-4 flex h-10 items-center justify-center gap-2 border border-slate-300 text-sm font-semibold text-slate-700"
      >
        Ver detalhes
        <ExternalLink size={16} />
      </Link>
    </article>
  );
}

export function ContratosClient() {
  const [dados, setDados] = useState<ContratosResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState("");

  const [contrato, setContrato] = useState("");
  const [status, setStatus] = useState("");

  const [opcoesContrato, setOpcoesContrato] = useState<SelectOption[]>([]);
  const [opcoesStatus, setOpcoesStatus] = useState<SelectOption[]>([]);

  async function carregarOpcoesFiltros() {
    try {
      const resposta = await buscarContratos();

      setOpcoesContrato(
        montarOpcoesUnicas(
          resposta.results.map((item) => item.numero_contrato),
          "CT",
        ),
      );

      setOpcoesStatus(
        montarOpcoesUnicas(resposta.results.map((item) => item.status)),
      );
    } catch {
      setOpcoesContrato([]);
      setOpcoesStatus([]);
    }
  }

  async function carregarContratos(filtros: ContratosRequestFiltros = {}) {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await buscarContratos(filtros);

      setDados(resposta);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os contratos.";

      setErro(mensagem);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarOpcoesFiltros();
    carregarContratos();
  }, []);

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    carregarContratos({
      contrato,
      status,
    });
  }

  function limparFiltros() {
    setContrato("");
    setStatus("");

    carregarContratos();
  }

  async function handleExportar() {
    try {
      setExportando(true);
      setErro("");

      await exportarContratosExcel({
        contrato,
        status,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar os contratos.";

      setErro(mensagem);
    } finally {
      setExportando(false);
    }
  }

  const contratos = dados?.results || [];
  const cards = dados?.cards;
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

          <div className="flex items-end">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 bg-[#111827] px-4 text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
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

      {carregando && <ContratosLoading />}

      {!carregando && cards && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Contratos"
            value={formatarNumero(cards.total_contratos)}
            description="Total encontrado nos filtros atuais"
            icon={ClipboardList}
          />

          <MetricCard
            label="Contratado"
            value={formatarMoeda(cards.total_contratado)}
            description="Soma dos contratos listados"
            icon={Landmark}
          />

          <MetricCard
            label="Medido"
            value={formatarMoeda(cards.total_medido)}
            description="Valor medido nos contratos"
            icon={Landmark}
          />

          <MetricCard
            label="Saldo"
            value={formatarMoeda(cards.saldo_estimado)}
            description="Diferença entre contratado e medido"
            icon={Landmark}
          />

          <MetricCard
            label="Evolução"
            value={formatarPercentual(cards.percentual_evolucao)}
            description="Percentual financeiro executado"
            icon={Percent}
          />
        </section>
      )}

      {!carregando && (
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Contratos cadastrados
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {formatarNumero(contratos.length)}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarContratos({
                  contrato,
                  status,
                })
              }
              className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {contratos.length ? (
              contratos.map((item) => (
                <ContratoCardMobile
                  key={item.numero_contrato}
                  contrato={item}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Nenhum contrato encontrado.
              </p>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Contrato</th>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Objeto</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3">Fim</th>
                  <th className="px-5 py-3">Valor total</th>
                  <th className="px-5 py-3">Execução</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {contratos.length ? (
                  contratos.map((item) => (
                    <tr
                      key={item.numero_contrato}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-5 py-4 font-bold text-slate-950">
                        {item.numero_contrato || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {item.empresa || "-"}
                      </td>

                      <td className="max-w-[360px] px-5 py-4 text-slate-600">
                        <p className="line-clamp-3">{item.objeto || "-"}</p>
                      </td>

                      <td className="px-5 py-4">{statusBadge(item.status)}</td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatarData(item.data_inicio)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatarData(item.data_fim)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarMoeda(item.valor_total)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {formatarPercentual(item.percentual_executado)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/contratos/${encodeURIComponent(
                            item.numero_contrato,
                          )}`}
                          className="inline-flex h-9 items-center gap-2 border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Ver
                          <ExternalLink size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-5 text-slate-400" colSpan={9}>
                      Nenhum contrato encontrado.
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