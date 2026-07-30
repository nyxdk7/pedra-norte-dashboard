"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
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
  type MedicoesRequestFiltros,
  type MedicoesResponse,
  type MedicoesVisao,
} from "@/lib/api";
import { formatarMoeda, formatarNumero } from "@/lib/formatters";

type SelectOption = { value: string; label: string };
type ResumoSituacao = MedicoesResponse["resumo_situacoes"][number];

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

const selectClass =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function montarOpcoesUnicas(valores: string[], prefixo = "") {
  const unicos = Array.from(
    new Set(valores.map((valor) => String(valor || "").trim()).filter(Boolean)),
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

function obterEstiloSituacao(situacao: string) {
  const texto = normalizarTexto(situacao);

  if (texto.includes("pago") || texto.includes("paga") || texto.includes("quitad")) {
    return { badge: "border-emerald-200 bg-emerald-50 text-emerald-700", ponto: "bg-emerald-500" };
  }
  if (texto.includes("liquid")) {
    return { badge: "border-teal-200 bg-teal-50 text-teal-700", ponto: "bg-teal-500" };
  }
  if (texto.includes("fatur")) {
    return { badge: "border-violet-200 bg-violet-50 text-violet-700", ponto: "bg-violet-500" };
  }
  if (texto.includes("fiscal")) {
    return { badge: "border-amber-200 bg-amber-50 text-amber-700", ponto: "bg-amber-500" };
  }
  if (texto.includes("supervis")) {
    return { badge: "border-blue-200 bg-blue-50 text-blue-700", ponto: "bg-blue-500" };
  }
  if (texto.includes("process") || texto.includes("protocol")) {
    return { badge: "border-orange-200 bg-orange-50 text-orange-700", ponto: "bg-orange-500" };
  }

  return { badge: "border-slate-200 bg-slate-50 text-slate-600", ponto: "bg-slate-400" };
}

function formatarData(data: string | null) {
  if (!data) return "-";
  const partes = data.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
}

function SituacaoBadge({ situacao }: { situacao: string }) {
  const texto = situacao || "Sem situação";
  const estilo = obterEstiloSituacao(texto);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${estilo.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${estilo.ponto}`} />
      {texto}
    </span>
  );
}

function MedicoesLoading() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-md border border-slate-200 bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-md border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-md border border-slate-200 bg-white" />
    </div>
  );
}

function ResumoSituacaoCard({ item }: { item: ResumoSituacao }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <SituacaoBadge situacao={item.situacao} />
        <span className="font-numeric text-lg font-semibold text-slate-900">
          {formatarNumero(item.total)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-[12px]">
        <div>
          <p className="text-slate-500">Medido</p>
          <p className="font-numeric mt-1 truncate font-medium text-slate-800" title={formatarMoeda(item.total_medido)}>
            {formatarMoeda(item.total_medido)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">A processar</p>
          <p className="font-numeric mt-1 truncate font-medium text-slate-800" title={formatarMoeda(item.total_a_processar)}>
            {formatarMoeda(item.total_a_processar)}
          </p>
        </div>
      </div>
    </article>
  );
}

function MedicaoMobileCard({ medicao }: { medicao: Medicao }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-slate-500">{medicao.mes_ano || "Sem período"}</p>
          <h3 className="mt-0.5 text-[14px] font-semibold text-slate-900">
            {medicao.numero_medicao || "Medição"}
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Contrato {medicao.numero_contrato || "-"}
          </p>
        </div>
        <SituacaoBadge situacao={medicao.situacao} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3 text-[12px]">
        {[
          ["Medido", medicao.valor_medido],
          ["Liquidado", medicao.valor_liquidado],
          ["Pago", medicao.valor_pago],
          ["A processar", medicao.valor_a_processar],
        ].map(([label, valor]) => (
          <div key={label}>
            <p className="text-slate-500">{label}</p>
            <p className="font-numeric mt-1 font-medium text-slate-800">{formatarMoeda(valor)}</p>
          </div>
        ))}
      </div>
    </article>
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
    () => ({ visao, contrato, situacao, mes_ano: mesAno }),
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

  const carregarMedicoes = useCallback(async (filtros: MedicoesRequestFiltros) => {
    try {
      setCarregando(true);
      setErro("");
      setDados(await buscarMedicoes(filtros));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as medições.");
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void carregarContratos(), 0);
    return () => window.clearTimeout(timeout);
  }, [carregarContratos]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void carregarMedicoes(filtrosAtuais), 0);
    return () => window.clearTimeout(timeout);
  }, [filtrosAtuais, carregarMedicoes]);

  function limparFiltros() {
    setVisao("pendentes");
    setContrato("");
    setSituacao("");
    setMesAno("");
  }

  function montarQueryStringAtual() {
    const params = new URLSearchParams();
    if (contrato.trim()) params.set("contrato", contrato.trim());
    if (situacao.trim()) params.set("situacao", situacao.trim());
    if (mesAno.trim()) params.set("mes_ano", mesAno.trim());
    params.set("visao", visao);
    return `?${params.toString()}`;
  }

  function handleExportarPdf() {
    setErro("");
    const url = `${API_BASE_URL}/relatorios/dashboard/pdf/${montarQueryStringAtual()}`;
    const janela = window.open(url, "_blank", "noopener,noreferrer");
    if (!janela) window.location.href = url;
  }

  async function handleExportarExcel() {
    try {
      setExportandoExcel(true);
      setErro("");
      await exportarMedicoesExcel(filtrosAtuais);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível exportar as medições.");
    } finally {
      setExportandoExcel(false);
    }
  }

  const cards = dados?.cards;
  const medicoes = dados?.results || [];
  const resumoSituacoes = dados?.resumo_situacoes || [];
  const visoes = dados?.opcoes.visoes?.length ? dados.opcoes.visoes : VISOES_PADRAO;
  const opcoesSituacao = dados?.opcoes.situacoes || [];
  const opcoesMeses = dados?.opcoes.meses || [];
  const meta = dados?.meta;
  const podeExportar = Boolean(dados?.permissions.pode_exportar);
  const quantidadeFiltros = [contrato, situacao, mesAno].filter(Boolean).length;

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-7">
      <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {visoes.map((opcao) => {
              const ativa = visao === opcao.value;
              return (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() => setVisao(opcao.value)}
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-[12px] font-medium transition ${
                    ativa
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opcao.label}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${ativa ? "bg-white/20" : "bg-slate-100"}`}>
                    {formatarNumero(opcao.total)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => carregarMedicoes(filtrosAtuais)}
              disabled={carregando}
              className="flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
              Atualizar
            </button>

            {podeExportar && (
              <details className="group relative">
                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md bg-slate-800 px-3 text-[12px] font-medium text-white hover:bg-slate-700 [&::-webkit-details-marker]:hidden">
                  <Download className="h-4 w-4" />
                  Exportar
                  <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
                  <button type="button" onClick={handleExportarPdf} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50">
                    <FileText className="h-4 w-4" /> Relatório PDF
                  </button>
                  <button type="button" onClick={handleExportarExcel} disabled={exportandoExcel} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <FileSpreadsheet className="h-4 w-4" /> {exportandoExcel ? "Exportando..." : "Planilha XLSX"}
                  </button>
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-500">Contrato</label>
            <select value={contrato} onChange={(e: ChangeEvent<HTMLSelectElement>) => setContrato(e.target.value)} className={selectClass}>
              <option value="">Todos os contratos</option>
              {opcoesContrato.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-500">Situação</label>
            <select value={situacao} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSituacao(e.target.value)} className={selectClass}>
              <option value="">Todas as situações</option>
              {opcoesSituacao.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-500">Mês/Ano</label>
            <select value={mesAno} onChange={(e: ChangeEvent<HTMLSelectElement>) => setMesAno(e.target.value)} className={selectClass}>
              <option value="">Todos os períodos</option>
              {opcoesMeses.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              disabled={!quantidadeFiltros && visao === "pendentes"}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 xl:w-auto"
            >
              <FilterX className="h-4 w-4" /> Limpar
              {quantidadeFiltros > 0 && <span className="rounded bg-slate-100 px-1.5 text-[10px]">{quantidadeFiltros}</span>}
            </button>
          </div>
        </div>
      </section>

      {erro && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{erro}</div>}
      {carregando && <MedicoesLoading />}

      {!carregando && cards && meta && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MetricCard label="Medições" value={formatarNumero(cards.total_medicoes)} description={`${formatarNumero(meta.total_disponivel)} disponíveis`} icon={Layers3} />
            <MetricCard label="Valor medido" value={formatarMoeda(cards.total_medido)} description="Total desta visão" icon={Landmark} />
            <MetricCard label="Liquidado" value={formatarMoeda(cards.total_liquidado)} description="Valor liquidado" icon={Banknote} />
            <MetricCard label="Pago" value={formatarMoeda(cards.total_pago)} description="Valor efetivamente pago" icon={Wallet} />
            <MetricCard label="Faturado" value={formatarMoeda(cards.total_faturado)} description="Valor faturado" icon={FileSpreadsheet} />
            <MetricCard label="A processar" value={formatarMoeda(cards.total_a_processar)} description="Saldo pendente" icon={ReceiptText} />
          </section>

          <section className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-[12px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {visao === "pendentes" ? <Clock3 className="h-4 w-4 text-amber-600" /> : visao === "pagas" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CalendarDays className="h-4 w-4 text-blue-600" />}
              <span>
                Exibindo <strong className="font-medium text-slate-800">{formatarNumero(meta.total_exibido)}</strong> de <strong className="font-medium text-slate-800">{formatarNumero(meta.total_disponivel)}</strong> registros, do mais recente para o mais antigo.
              </span>
            </div>
            {meta.pagas_ocultas > 0 && <span>{formatarNumero(meta.pagas_ocultas)} pagas ocultas</span>}
          </section>

          {resumoSituacoes.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-end justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Situação atual</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">Resumo por etapa do processo</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {resumoSituacoes.map((item) => <ResumoSituacaoCard key={item.situacao} item={item} />)}
              </div>
            </section>
          )}

          <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900">Medições</h2>
                <p className="mt-0.5 text-[12px] text-slate-500">Valores organizados para comparação rápida</p>
              </div>
              <span className="text-[12px] text-slate-500">{formatarNumero(medicoes.length)} registros</span>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {medicoes.length ? medicoes.map((item, index) => (
                <MedicaoMobileCard key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}-${index}`} medicao={item} />
              )) : (
                <div className="p-8 text-center text-[13px] text-slate-500">Nenhuma medição encontrada.</div>
              )}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Mês/Ano</th>
                    <th className="px-4 py-2.5 font-medium">Medição</th>
                    <th className="px-4 py-2.5 font-medium">Contrato</th>
                    <th className="px-4 py-2.5 font-medium">Medido</th>
                    <th className="px-4 py-2.5 font-medium">Liquidado</th>
                    <th className="px-4 py-2.5 font-medium">Pago</th>
                    <th className="px-4 py-2.5 font-medium">Faturado</th>
                    <th className="px-4 py-2.5 font-medium">A processar</th>
                    <th className="px-4 py-2.5 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {medicoes.length ? medicoes.map((item, index) => (
                    <tr key={`${item.numero_contrato}-${item.numero_medicao}-${item.mes_ano}-${index}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.mes_ano || "-"}</td>
                      <td className="px-4 py-3">{item.numero_medicao || "-"}</td>
                      <td className="px-4 py-3">{item.numero_contrato || "-"}</td>
                      <td className="font-numeric whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatarMoeda(item.valor_medido)}</td>
                      <td className="font-numeric whitespace-nowrap px-4 py-3">{formatarMoeda(item.valor_liquidado)}</td>
                      <td className="font-numeric whitespace-nowrap px-4 py-3">{formatarMoeda(item.valor_pago)}</td>
                      <td className="font-numeric whitespace-nowrap px-4 py-3">{formatarMoeda(item.valor_faturado)}</td>
                      <td className="font-numeric whitespace-nowrap px-4 py-3">{formatarMoeda(item.valor_a_processar)}</td>
                      <td className="px-4 py-3"><SituacaoBadge situacao={item.situacao} /></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Nenhuma medição encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
