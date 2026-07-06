import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  Landmark,
  Percent,
  Wallet,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { MetricCard } from "@/components/layout/metric-card";

const metrics = [
  {
    label: "Total contratado",
    value: "R$ 0,00",
    description: "Valor total dos contratos cadastrados",
    icon: Landmark,
  },
  {
    label: "Total medido",
    value: "R$ 0,00",
    description: "Soma das medições lançadas no sistema",
    icon: BarChart3,
  },
  {
    label: "Total pago",
    value: "R$ 0,00",
    description: "Pagamentos identificados nas medições",
    icon: Wallet,
  },
  {
    label: "Saldo estimado",
    value: "R$ 0,00",
    description: "Diferença entre contratado e medido",
    icon: BriefcaseBusiness,
  },
  {
    label: "Total faturado",
    value: "R$ 0,00",
    description: "Valor faturado no período filtrado",
    icon: FileCheck2,
  },
  {
    label: "A processar",
    value: "R$ 0,00",
    description: "Medições pendentes de processamento",
    icon: FileSpreadsheet,
  },
  {
    label: "Contratos",
    value: "0",
    description: "Quantidade de contratos monitorados",
    icon: ClipboardList,
  },
  {
    label: "Evolução",
    value: "0%",
    description: "Percentual financeiro executado",
    icon: Percent,
  },
];

export default function DashboardPage() {
  return (
    <>
      <AppHeader
        title="Dashboard da Pedra Norte"
        subtitle="Resumo geral dos contratos, medições e evolução financeira"
        section="Dashboard"
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-950">
                Evolução mensal
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Espaço reservado para o gráfico de valor medido por mês.
              </p>
            </div>

            <div className="flex h-72 items-center justify-center px-5 py-6 text-sm text-slate-400">
              Gráfico será conectado na próxima etapa
            </div>
          </div>

          <div className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-950">
                Resumo financeiro
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Espaço reservado para contratado, medido, pago e faturado.
              </p>
            </div>

            <div className="flex h-72 items-center justify-center px-5 py-6 text-sm text-slate-400">
              Gráfico será conectado na próxima etapa
            </div>
          </div>
        </section>
      </div>
    </>
  );
}