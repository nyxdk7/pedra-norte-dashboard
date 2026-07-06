import { CheckCircle2, History, RefreshCw, XCircle } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { MetricCard } from "@/components/layout/metric-card";

export default function HistoricoPage() {
  return (
    <>
      <AppHeader
        title="Histórico de sincronizações"
        subtitle="Registro das importações realizadas a partir da planilha"
        section="Histórico"
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Sincronizações"
            value="0"
            description="Total registrado no histórico"
            icon={History}
          />
          <MetricCard
            label="Sucessos"
            value="0"
            description="Sincronizações concluídas"
            icon={CheckCircle2}
          />
          <MetricCard
            label="Falhas"
            value="0"
            description="Sincronizações com erro"
            icon={XCircle}
          />
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Últimas sincronizações
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A tabela real será conectada ao endpoint
                /api/historico-sincronizacoes/.
              </p>
            </div>

            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
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
                <tr className="border-t border-slate-200">
                  <td className="px-5 py-5 text-slate-400" colSpan={7}>
                    Dados serão carregados da API na próxima etapa.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}