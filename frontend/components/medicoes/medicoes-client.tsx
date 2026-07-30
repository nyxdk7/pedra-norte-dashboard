"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  Archive,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileSpreadsheet,
  FileText,
  FilterX,
  Landmark,
  Layers3,
  ReceiptText,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/layout/metric-card";
import {
  API_BASE_URL,
  buscarContratos,
  buscarMedicoes,
  exportarMedicoesExcel,
  type Medicao,
  type MedicoesGrupoSituacao,
  type MedicoesRequestFiltros,
  type MedicoesResponse,
  type MedicoesVisao,
} from "@/lib/api";
import { formatarMoeda, formatarNumero } from "@/lib/formatters";

type SelectOption = {
  value: string;
  label: string;
};

type SituacaoStyle = {
  badge: string;
  borda: string;
  topo: string;
  ponto: string;
};

const VISOES_PADRAO: Array<{
  value: MedicoesVisao;
  label: string;
  total: number;
}> = [
  { value: "pendentes", label: "Pendentes", total: 0 },
  { value: "recentes", label: "Recentes", total: 0 },
  { value: "pagas", label: "Pagas", total: 0 },
  { value: "historico", label: "Histórico", total: 0 },
];

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

function normalizarTexto(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function obterEstiloSituacao(situacao: string): SituacaoStyle {
  const texto = normalizarTexto(situacao);

  if (
    texto.includes("pago") ||
    texto.includes("paga") ||
    texto.includes("quitad")
  ) {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      borda: "border-l-emerald-500",
      topo: "border-t-emerald-500",
      ponto: "bg-emerald-500",
    };
  }

  if (texto.includes("liquid")) {
    return {
      badge: "border-teal-200 bg-teal-50 text-teal-800",
      borda: "border-l-teal-500",
      topo: "border-t-teal-500",
      ponto: "bg-teal-500",
    };
  }

  if (texto.includes("fatur")) {
    return {
      badge: "border-violet-200 bg-violet-50 text-violet-800",
      borda: "border-l-violet-500",
      topo: "border-t-violet-500",
      ponto: "bg-violet-500",
    };
  }

  if (texto.includes("fiscal")) {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      borda: "border-l-amber-500",
      topo: "border-t-amber-500",
      ponto: "bg-amber-500",
    };
  }

  if (texto.includes("supervis")) {
    return {
      badge: "border-blue-200 bg-blue-50 text-blue-800",
      borda: "border-l-blue-500",
      topo: "border-t-blue-500",
      ponto: "bg-blue-500",
    };
  }

  if (texto.includes("process")) {
    return {
      badge: "border-orange-200 bg-orange-50 text-orange-800",
      borda: "border-l-orange-500",
      topo: "border-t-orange-500",
      ponto: "bg-orange-500",
    };
  }

  return {
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    borda: "border-l-slate-400",
    topo: "border-t-slate-400",
    ponto: "bg-slate-400",
  };
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

function SituacaoBadge({ situacao }: { situacao: string }) {
  const texto = situacao || "Sem situação";
  const estilo = obterEstiloSituacao(texto);

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold ${estilo.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${estilo.ponto}`} />
      {texto}
    </span>
  );
}

function MedicoesLoading() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse border border-slate-200 bg-white shadow-sm" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}

function ValorFinanceiro({
  label,
  valor,
  destaque = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p
        title={formatarMoeda(valor)}
        className={`mt-1 break-words text-sm font-black leading-tight ${
          destaque ? "text-slate-950" : "text-slate-700"
        }`}
      >
        {formatarMoeda(valor)}
      </p>
    </div>
  );
}

function MedicaoCardMobile({ medicao }: { medicao: Medicao }) {
  const estilo = obterEstiloSituacao(medicao.situacao);

  return (
    <article
      className={`border border-l-4 border-slate-200 bg-white p-4 shadow-sm ${estilo.borda}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {medicao.mes_ano || "Mês não informado"}
          </p>

          <h3 className="mt-1 truncate text-base font-black text-slate-950">
            Medição {medicao.numero_medicao || "-"}
          </h3>

          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            Contrato {medicao.numero_contrato || "-"}
          </p>
        </div>

        <div className="shrink-0">
          <SituacaoBadge situacao={medicao.situacao} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
        <ValorFinanceiro
          label="Medido"
          valor={medicao.valor_medido}
          destaque
        />
        <ValorFinanceiro
          label="Liquidado"
          valor={medicao.valor_liquidado}
        />
        <ValorFinanceiro label="Pago" valor={medicao.valor_pago} />
      </div>

      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-slate-600 [&::-webkit-details-marker]:hidden">
          Ver detalhes financeiros
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Faturado
            </p>
            <p className="mt-1 font-bold text-slate-700">
              {formatarMoeda(medicao.valor_faturado)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              A processar
            </p>
            <p className="mt-1 font-bold text-slate-700">
              {formatarMoeda(medicao.valor_a_processar)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Faturamento
            </p>
            <p className="mt-1 font-semibold text-slate-600">
              {formatarData(medicao.data_faturamento)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Pagamento
            </p>
            <p className="mt-1 font-semibold text-slate-600">
              {formatarData(medicao.data_pagamento)}
            </p>
          </div>
        </div>
      </details>
    </article>
  );
}

function GrupoSituacao({ grupo }: { grupo: MedicoesGrupoSituacao }) {
  const [expandido, setExpandido] = useState(false);
  const limiteInicial = 6;
  const itens = expandido ? grupo.items : grupo.items.slice(0, limiteInicial);
  const possuiMais = grupo.items.length > limiteInicial;
  const estilo = obterEstiloSituacao(grupo.situacao);

  return (
    <section
      className={`border border-l-4 border-slate-200 bg-white shadow-sm ${estilo.borda}`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <SituacaoBadge situacao={grupo.situacao} />

          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">
              {formatarNumero(grupo.total)}{" "}
              {grupo.total === 1 ? "medição" : "medições"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Mais recentes primeiro
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Medido
            </p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {formatarMoeda(grupo.total_medido)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Pago
            </p>
            <p className="mt-1 text-sm font-black text-slate-700">
              {formatarMoeda(grupo.total_pago)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 lg:hidden">
        {itens.map((item, index) => (
          <MedicaoCardMobile
            key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}-${index}`}
            medicao={item}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              <th className="px-4 py-3">Mês/Ano</th>
              <th className="px-4 py-3">Medição</th>
              <th className="px-4 py-3">Contrato</th>
              <th className="px-4 py-3">Medido</th>
              <th className="px-4 py-3">Liquidado</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Faturado</th>
              <th className="px-4 py-3">A processar</th>
            </tr>
          </thead>

          <tbody>
            {itens.map((item, index) => (
              <tr
                key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}-${index}`}
                className="border-b border-slate-100 text-slate-700 transition last:border-b-0 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-3 font-black text-slate-950">
                  {item.mes_ano || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {item.numero_medicao || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {item.numero_contrato || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">
                  {formatarMoeda(item.valor_medido)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatarMoeda(item.valor_liquidado)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatarMoeda(item.valor_pago)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatarMoeda(item.valor_faturado)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatarMoeda(item.valor_a_processar)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {possuiMais && (
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => setExpandido((atual) => !atual)}
            className="flex h-10 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {expandido ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Ver mais {formatarNumero(grupo.items.length - limiteInicial)}
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

export function MedicoesClient() {
  const [dados, setDados] = useState<MedicoesResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [erro, setErro] = useState("");

  const [visao, setVisao] = useState<MedicoesVisao>("pendentes");
  const [contrato, setContrato] = useState("");
  const [situacao, setSituacao] = useState("");
  const [mesAno, setMesAno] = useState("");

  const [opcoesContrato, setOpcoesContrato] = useState<SelectOption[]>([]);

  const filtrosAtuais = useMemo<MedicoesRequestFiltros>(
    () => ({
      visao,
      contrato,
      situacao,
      mes_ano: mesAno,
    }),
    [visao, contrato, situacao, mesAno],
  );

  const carregarContratos = useCallback(async () => {
    try {
      const resposta = await buscarContratos();

      setOpcoesContrato(
        montarOpcoesUnicas(
          resposta.results.map((item) => item.numero_contrato),
          "CT",
        ),
      );
    } catch {
      setOpcoesContrato([]);
    }
  }, []);

  const carregarMedicoes = useCallback(
    async (filtros: MedicoesRequestFiltros) => {
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
    const timeoutId = window.setTimeout(() => {
      void carregarContratos();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarContratos]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarMedicoes(filtrosAtuais);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [filtrosAtuais, carregarMedicoes]);

  function limparFiltros() {
    setVisao("pendentes");
    setContrato("");
    setSituacao("");
    setMesAno("");
  }

  function montarQueryStringAtual() {
    const params = new URLSearchParams();

    if (contrato.trim()) {
      params.set("contrato", contrato.trim());
    }

    if (situacao.trim()) {
      params.set("situacao", situacao.trim());
    }

    if (mesAno.trim()) {
      params.set("mes_ano", mesAno.trim());
    }

    params.set("visao", visao);

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

      await exportarMedicoesExcel(filtrosAtuais);
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

  const cards = dados?.cards;
  const grupos = dados?.grupos_situacao || [];
  const resumoSituacoes = dados?.resumo_situacoes || [];
  const visoes = dados?.opcoes.visoes?.length
    ? dados.opcoes.visoes
    : VISOES_PADRAO;
  const opcoesSituacao = dados?.opcoes.situacoes || [];
  const opcoesMeses = dados?.opcoes.meses || [];
  const meta = dados?.meta;
  const podeExportar = Boolean(dados?.permissions.pode_exportar);
  const quantidadeFiltros = [contrato, situacao, mesAno].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Visão das medições
              </p>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {visoes.map((opcao) => {
                  const ativa = visao === opcao.value;

                  return (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => setVisao(opcao.value)}
                      className={`flex h-10 shrink-0 items-center gap-2 border px-3 text-sm font-bold transition ${
                        ativa
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opcao.label}
                      <span
                        className={`min-w-6 px-1.5 py-0.5 text-xs ${
                          ativa
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {formatarNumero(opcao.total)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => carregarMedicoes(filtrosAtuais)}
                disabled={carregando}
                className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`}
                />
                Atualizar
              </button>

              {podeExportar ? (
                <details className="group relative">
                  <summary className="flex h-10 cursor-pointer list-none items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                    <FileText className="h-4 w-4" />
                    Exportar
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>

                  <div className="absolute right-0 z-20 mt-2 w-52 border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={handleExportarPdf}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      Relatório PDF
                    </button>

                    <button
                      type="button"
                      onClick={handleExportarExcel}
                      disabled={exportandoExcel}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      {exportandoExcel ? "Exportando..." : "Planilha XLSX"}
                    </button>
                  </div>
                </details>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex h-10 cursor-not-allowed items-center justify-center gap-2 border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-400"
                >
                  <FileText className="h-4 w-4" />
                  Exportar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Contrato
            </label>

            <select
              value={contrato}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setContrato(event.target.value)
              }
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
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Situação
            </label>

            <select
              value={situacao}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSituacao(event.target.value)
              }
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todas as situações</option>

              {opcoesSituacao.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Mês/Ano
            </label>

            <select
              value={mesAno}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setMesAno(event.target.value)
              }
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os períodos</option>

              {opcoesMeses.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              disabled={!quantidadeFiltros && visao === "pendentes"}
              className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
            >
              <FilterX className="h-4 w-4" />
              Limpar
              {quantidadeFiltros > 0 && (
                <span className="bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  {quantidadeFiltros}
                </span>
              )}
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

      {!carregando && cards && meta && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <MetricCard
              label="Medições"
              value={formatarNumero(cards.total_medicoes)}
              description={`Exibidas de ${formatarNumero(meta.total_disponivel)}`}
              icon={Layers3}
            />

            <MetricCard
              label="Medido"
              value={formatarMoeda(cards.total_medido)}
              description="Valor medido"
              icon={Landmark}
            />

            <MetricCard
              label="Liquidado"
              value={formatarMoeda(cards.total_liquidado)}
              description="Valor liquidado"
              icon={Banknote}
            />

            <MetricCard
              label="Pago"
              value={formatarMoeda(cards.total_pago)}
              description="Valor pago"
              icon={Wallet}
            />

            <MetricCard
              label="A processar"
              value={formatarMoeda(cards.total_a_processar)}
              description="Saldo pendente"
              icon={ReceiptText}
            />
          </section>

          <section className="border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
            <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                {visao === "pendentes" ? (
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                ) : visao === "pagas" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                )}

                <p>
                  Exibindo{" "}
                  <strong className="text-slate-950">
                    {formatarNumero(meta.total_exibido)}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-950">
                    {formatarNumero(meta.total_disponivel)}
                  </strong>{" "}
                  registros desta visão, sempre do período mais recente para o
                  mais antigo.
                </p>
              </div>

              {meta.pagas_ocultas > 0 && (
                <p className="shrink-0 text-xs font-bold text-slate-500">
                  {formatarNumero(meta.pagas_ocultas)} pagas ocultas
                </p>
              )}
            </div>

            {meta.ocultas_por_limite > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
                Há {formatarNumero(meta.ocultas_por_limite)} registros mais
                antigos fora da exibição rápida. Use a visão Histórico para
                consultar o conjunto completo.
              </div>
            )}
          </section>

          {resumoSituacoes.length > 0 && (
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                <h2 className="text-base font-black text-slate-950">
                  Situação atual
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Resumo dos registros exibidos, separados pela etapa atual.
                </p>
              </div>

              <div className="flex snap-x gap-3 overflow-x-auto p-4 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
                {resumoSituacoes.map((item) => {
                  const estilo = obterEstiloSituacao(item.situacao);

                  return (
                    <article
                      key={item.situacao}
                      className={`min-w-[240px] snap-start border border-t-4 border-slate-200 bg-white p-4 sm:min-w-0 ${estilo.topo}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <SituacaoBadge situacao={item.situacao} />
                        <span className="text-xl font-black text-slate-950">
                          {formatarNumero(item.total)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Medido
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            {formatarMoeda(item.total_medido)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Liquidado
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-700">
                            {formatarMoeda(item.total_liquidado)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Medições por situação
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  As medições mais recentes aparecem primeiro dentro de cada
                  etapa.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Archive className="h-4 w-4" />
                {formatarNumero(grupos.length)} situações
              </div>
            </div>

            {grupos.length ? (
              grupos.map((grupo) => (
                <GrupoSituacao key={grupo.situacao} grupo={grupo} />
              ))
            ) : (
              <div className="border border-slate-200 bg-white p-8 text-center shadow-sm">
                <ReceiptText className="mx-auto h-8 w-8 text-slate-300" />
                <h3 className="mt-3 text-base font-black text-slate-950">
                  Nenhuma medição encontrada
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Ajuste a visão ou limpe os filtros para consultar outros
                  registros.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
