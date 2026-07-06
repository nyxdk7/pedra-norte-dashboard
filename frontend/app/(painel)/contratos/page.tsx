import { ContratosClient } from "@/components/contratos/contratos-client";
import { AppHeader } from "@/components/layout/app-header";

export default function ContratosPage() {
  return (
    <>
      <AppHeader
        title="Contratos"
        subtitle="Consulta, filtros e acompanhamento dos contratos cadastrados"
        section="Contratos"
      />

      <ContratosClient />
    </>
  );
}