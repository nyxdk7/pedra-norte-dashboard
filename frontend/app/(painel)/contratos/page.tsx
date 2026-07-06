import { ClipboardList, FileDown, Landmark, Percent } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { MetricCard } from "@/components/layout/metric-card";

export default function ContratosPage() {
  return (
    <>
      <AppHeader
        title="Contratos"
        subtitle="Consulta, filtros e acompanhamento dos contratos cadastrados"
        section="Contratos"
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Contratos"
            value="0"
            description="Total encontrado nos filtros atuais"
            icon={ClipboardList}
          />
          <MetricCard
            label="Valor contratado"
            value="R$ 0,00"
            description="Soma do valor contratual"
            icon={Landmark}
          />
          <MetricCard
            label="Executado"
            value="0%"
            description="Percentual médio de execução"
            icon={Percent}
          />
          <MetricCard
            label="Exportação"
            value="XLSX"
            description="Exportação de contratos em Excel"
            icon={FileDown}
          />
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">
              Contratos cadastrados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A tabela real será conectada ao endpoint /api/contratos/.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Contrato</th>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Execução</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="px-5 py-5 text-slate-400" colSpan={6}>
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