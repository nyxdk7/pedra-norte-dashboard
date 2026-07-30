"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Landmark,
  Percent,
  RefreshCw,
} from "lucide-react";

import { MetricCard } from "@/components/layout/metric-card";
import {
  API_BASE_URL,
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
      className={`inline-flex items-center px-2 py-1 text-xs font-bold ${classes}`}
    >
      {texto}
    </span>
  );
}

function ContratosLoading() {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      Carregando contratos...
    </div>
  );
}

type ContratoCardMobileProps = {
  contrato: Contrato;
};

function ContratoCardMobile({ contrato }: ContratoCardMobileProps) {
  const hrefDetalhe = `/contratos/${encodeURIComponent(
    contrato.numero_contrato,
  )}`;

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
            Contrato
          </p>

          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {contrato.numero_contrato || "-"}
          </h3>
        </div>

        {statusBadge(contrato.status)}
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Empresa
          </p>

          <p className="mt-1 font-medium text-slate-800">
            {contrato.empresa || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Objeto
          </p>

          <p className="mt-1 text-slate-700">
            {contrato.objeto || "-"}
          </p>
        </div>
      </div>

      <Link
        href={hrefDetalhe}
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 border border-slate-300 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        Ver detalhes
        <ExternalLink className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function ContratosClient() {
  const [dados, setDados] = useState<ContratosResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [erro, setErro] = useState("");

  const [contrato, setContrato] = useState("");
  const [status, setStatus] = useState("");

  const [opcoesContrato, setOpcoesContrato] = useState<SelectOption[]>([]);
  const [opcoesStatus, setOpcoesStatus] = useState<SelectOption[]>([]);

  const carregarOpcoesFiltros = useCallback(async () => {
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
  }, []);

  const carregarContratos = useCallback(
    async (filtros: ContratosRequestFiltros = {}) => {
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
    },
    [],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarOpcoesFiltros();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarOpcoesFiltros]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarContratos({
        contrato,
        status,
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [contrato, status, carregarContratos]);

  function limparFiltros() {
    setContrato("");
    setStatus("");
  }

  function montarQueryStringAtual() {
    const params = new URLSearchParams();

    if (contrato.trim()) {
      params.set("contrato", contrato.trim());
    }

    if (status.trim()) {
      params.set("status", status.trim());
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
      setExportandoExcel(false);
    }
  }

  const contratos = dados?.results || [];
  const cards = dados?.cards;
  const podeExportar = Boolean(dados?.permissions.pode_exportar);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-7">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto_auto]">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Contrato
            </label>

            <select
              value={contrato}
              onChange={(event) => setContrato(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
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
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Status
            </label>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
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
              type="button"
              onClick={limparFiltros}
              className="h-9 w-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 xl:w-auto"
            >
              Limpar
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleExportarPdf}
              disabled={!podeExportar}
              className="flex h-9 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
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
              className="flex h-9 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
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

      {carregando && <ContratosLoading />}

      {!carregando && cards && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
        <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
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
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          <div className="grid gap-4 p-4 lg:hidden">
            {contratos.length ? (
              contratos.map((item) => (
                <ContratoCardMobile
                  key={item.numero_contrato}
                  contrato={item}
                />
              ))
            ) : (
              <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
                Nenhum contrato encontrado.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-4 py-3">Contrato</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Objeto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {contratos.length ? (
                  contratos.map((item) => {
                    const hrefDetalhe = `/contratos/${encodeURIComponent(
                      item.numero_contrato,
                    )}`;

                    return (
                      <tr
                        key={item.numero_contrato}
                        className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-950">
                          {item.numero_contrato || "-"}
                        </td>

                        <td className="px-4 py-3">{item.empresa || "-"}</td>

                        <td className="max-w-[360px] px-4 py-3">
                          {item.objeto || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {statusBadge(item.status)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Link
                            href={hrefDetalhe}
                            className="inline-flex h-9 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                          >
                            Ver
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
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