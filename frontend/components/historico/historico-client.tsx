"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  History,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { MetricCard } from "@/components/layout/metric-card";
import { apiRequest, type UsuarioPermissoes } from "@/lib/api";
import { formatarNumero } from "@/lib/formatters";

type HistoricoItem = {
  usuario: string;
  origem: string;
  status: string;
  total_contratos: number;
  total_medicoes: number;
  mensagem: string;
  data_hora: string | null;
};

type HistoricoResponse = {
  results: HistoricoItem[];
  permissions: UsuarioPermissoes;
  detail?: string;
};

function formatarDataHora(valor: string | null) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function normalizarStatus(status: string) {
  return String(status || "").trim().toLowerCase();
}

function statusEhSucesso(status: string) {
  const texto = normalizarStatus(status);

  return (
    texto.includes("sucesso") ||
    texto.includes("conclu") ||
    texto.includes("ok") ||
    texto === "success"
  );
}

function statusEhFalha(status: string) {
  const texto = normalizarStatus(status);

  return (
    texto.includes("erro") ||
    texto.includes("falha") ||
    texto.includes("failed") ||
    texto.includes("error")
  );
}

function StatusBadge({ status }: { status: string }) {
  const texto = status || "Sem status";

  if (statusEhSucesso(texto)) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={14} />
        {texto}
      </span>
    );
  }

  if (statusEhFalha(texto)) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
        <XCircle size={14} />
        {texto}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      <AlertCircle size={14} />
      {texto}
    </span>
  );
}

function HistoricoLoading() {
  return (
    <div className="border border-slate-200 bg-white px-5 py-8 text-sm font-semibold text-slate-500 shadow-sm">
      <span className="mr-3 inline-block h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-900 align-[-2px]" />
      Carregando histórico...
    </div>
  );
}

type HistoricoCardMobileProps = {
  item: HistoricoItem;
};

function HistoricoCardMobile({ item }: HistoricoCardMobileProps) {
  return (
    <article className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Data/Hora
          </p>
          <h3 className="mt-1 text-sm font-bold text-slate-950">
            {formatarDataHora(item.data_hora)}
          </h3>
        </div>

        <StatusBadge status={item.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Usuário</p>
          <p className="mt-1 text-slate-800">{item.usuario || "-"}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Origem</p>
          <p className="mt-1 text-slate-800">{item.origem || "-"}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">
            Contratos
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarNumero(item.total_contratos)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-slate-400">
            Medições
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {formatarNumero(item.total_medicoes)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase text-slate-400">Mensagem</p>
        <p className="mt-1 text-sm leading-5 text-slate-700">
          {item.mensagem || "-"}
        </p>
      </div>
    </article>
  );
}

export function HistoricoClient() {
  const [dados, setDados] = useState<HistoricoResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarHistorico() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await apiRequest<HistoricoResponse>(
        "/historico-sincronizacoes/",
      );

      setDados(resposta);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o histórico.";

      setErro(mensagem);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  const historicos = dados?.results || [];

  const resumo = useMemo(() => {
    const sucessos = historicos.filter((item) =>
      statusEhSucesso(item.status),
    ).length;

    const falhas = historicos.filter((item) =>
      statusEhFalha(item.status),
    ).length;

    const ultimo = historicos[0];

    return {
      total: historicos.length,
      sucessos,
      falhas,
      ultimaData: ultimo ? formatarDataHora(ultimo.data_hora) : "-",
    };
  }, [historicos]);

  return (
    <div className="space-y-6 px-5 py-6 lg:px-8">
      {erro && (
        <section className="border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {erro}
        </section>
      )}

      {carregando && <HistoricoLoading />}

      {!carregando && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Sincronizações"
              value={formatarNumero(resumo.total)}
              description="Total registrado no histórico"
              icon={History}
            />

            <MetricCard
              label="Sucessos"
              value={formatarNumero(resumo.sucessos)}
              description="Sincronizações concluídas"
              icon={CheckCircle2}
            />

            <MetricCard
              label="Falhas"
              value={formatarNumero(resumo.falhas)}
              description="Sincronizações com erro"
              icon={XCircle}
            />

            <MetricCard
              label="Última"
              value={resumo.ultimaData}
              description="Última sincronização registrada"
              icon={CalendarClock}
            />
          </section>

          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Últimas sincronizações
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Total encontrado: {formatarNumero(historicos.length)}
                </p>
              </div>

              <button
                type="button"
                onClick={carregarHistorico}
                className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Atualizar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {historicos.length ? (
                historicos.map((item, index) => (
                  <HistoricoCardMobile
                    key={`${item.data_hora}-${index}`}
                    item={item}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhum histórico encontrado.
                </p>
              )}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Data/Hora</th>
                    <th className="px-5 py-3">Usuário</th>
                    <th className="px-5 py-3">Origem</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Contratos</th>
                    <th className="px-5 py-3">Medições</th>
                    <th className="px-5 py-3">Mensagem</th>
                  </tr>
                </thead>

                <tbody>
                  {historicos.length ? (
                    historicos.map((item, index) => (
                      <tr
                        key={`${item.data_hora}-${index}`}
                        className="border-t border-slate-200 align-top"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {formatarDataHora(item.data_hora)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {item.usuario || "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {item.origem || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {formatarNumero(item.total_contratos)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {formatarNumero(item.total_medicoes)}
                        </td>
                        <td className="max-w-[420px] px-5 py-4 text-slate-600">
                          <p className="line-clamp-3">
                            {item.mensagem || "-"}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-5 text-slate-400" colSpan={7}>
                        Nenhum histórico encontrado.
                      </td>
                    </tr>
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