import { AppHeader } from "@/components/layout/app-header";
import { MedicoesClient } from "@/components/medicoes/medicoes-client";

export default function MedicoesPage() {
  return (
    <>
      <AppHeader
        title="Medições"
        subtitle="Acompanhe pendências, etapas e valores dos registros mais recentes"
        section="Medições"
      />

      <MedicoesClient />
    </>
  );
}
