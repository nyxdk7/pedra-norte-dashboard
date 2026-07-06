import { AppHeader } from "@/components/layout/app-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <AppHeader
        title="Dashboard da Pedra Norte"
        subtitle="Resumo geral dos contratos, medições e evolução financeira"
        section="Dashboard"
      />

      <DashboardClient />
    </>
  );
}