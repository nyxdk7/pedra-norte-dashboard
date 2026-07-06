import { AppHeader } from "@/components/layout/app-header";
import { MedicoesClient } from "@/components/medicoes/medicoes-client";

export default function MedicoesPage() {
  return (
    <>
      <AppHeader
        title="Medições"
        subtitle="Acompanhamento financeiro das medições importadas da planilha"
        section="Medições"
      />

      <MedicoesClient />
    </>
  );
}