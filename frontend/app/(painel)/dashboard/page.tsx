import { AppHeader } from "@/components/layout/app-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <AppHeader
        title="Visão geral"
        subtitle="Indicadores financeiros, contratos e andamento das medições"
        section="Dashboard"
      />

      <DashboardClient />
    </>
  );
}