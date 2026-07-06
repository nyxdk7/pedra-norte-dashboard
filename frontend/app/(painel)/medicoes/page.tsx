import {
  Banknote,
  FileSpreadsheet,
  Landmark,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { MetricCard } from "@/components/layout/metric-card";

export default function MedicoesPage() {
  return (
    <>
      <AppHeader
        title="Medições"
        subtitle="Acompanhamento financeiro das medições importadas da planilha"
        section="Medições"
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Medições"
            value="0"
            description="Registros encontrados"
            icon={FileSpreadsheet}
          />
          <MetricCard
            label="Medido"
            value="R$ 0,00"
            description="Total medido"
            icon={Landmark}
          />
          <MetricCard
            label="Pago"
            value="R$ 0,00"
            description="Total pago"
            icon={Wallet}
          />
          <MetricCard
            label="Faturado"
            value="R$ 0,00"
            description="Total faturado"
            icon={ReceiptText}
          />
          <MetricCard
            label="A processar"
            value="R$ 0,00"
            description="Saldo pendente"
            icon={Banknote}
          />
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">
              Medições cadastradas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A tabela real será conectada ao endpoint /api/medicoes/.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Medição</th>
                  <th className="px-5 py-3">Contrato</th>
                  <th className="px-5 py-3">Mês/Ano</th>
                  <th className="px-5 py-3">Valor medido</th>
                  <th className="px-5 py-3">Valor pago</th>
                  <th className="px-5 py-3">Situação</th>
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