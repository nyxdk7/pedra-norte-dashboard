import { AppHeader } from "@/components/layout/app-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <AppHeader
        title="MSM Industrial"
        subtitle="Resumo geral dos contratos, medições e evolução financeira"
        section="Dashboard"
      />

      <DashboardClient />
    </>
  );
}