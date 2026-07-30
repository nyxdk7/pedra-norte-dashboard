import { AppHeader } from "@/components/layout/app-header";
import { MedicoesClient } from "@/components/medicoes/medicoes-client";

export default function MedicoesPage() {
  return (
    <>
      <AppHeader
        title="Medições"
        subtitle="Pendências recentes organizadas por etapa, com consulta rápida no celular"
        section="Medições"
      />

      <MedicoesClient />
    </>
  );
}
