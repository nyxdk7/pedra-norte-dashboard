import { ConfiguracoesClient } from "@/components/configuracoes/configuracoes-client";
import { AppHeader } from "@/components/layout/app-header";

export default function ConfiguracoesPage() {
  return (
    <>
      <AppHeader
        title="Configurações"
        subtitle="Ajustes visuais e preferências do sistema"
      />

      <ConfiguracoesClient />
    </>
  );
}