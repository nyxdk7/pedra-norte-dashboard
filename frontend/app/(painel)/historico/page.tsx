import { HistoricoClient } from "@/components/historico/historico-client";
import { AppHeader } from "@/components/layout/app-header";

export default function HistoricoPage() {
  return (
    <>
      <AppHeader
        title="Histórico de sincronizações"
        subtitle="Registro das importações realizadas a partir da planilha"
        section="Histórico"
      />

      <HistoricoClient />
    </>
  );
}