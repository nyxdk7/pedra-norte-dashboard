import { AppHeader } from "@/components/layout/app-header";
import { MedicoesClient } from "@/components/medicoes/medicoes-client";

export default function MedicoesPage() {
  return (
    <>
      <AppHeader
        title="Acompanhamento de medições"
        subtitle="Visualize pendências, etapas atuais e valores financeiros com prioridade para os registros mais recentes."
        section="Medições"
      />

      <MedicoesClient />
    </>
  );
}
