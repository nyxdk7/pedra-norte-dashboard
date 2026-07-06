import { AdministradorClient } from "@/components/administrador/administrador-client";
import { AppHeader } from "@/components/layout/app-header";

export default function AdministradorPage() {
  return (
    <>
      <AppHeader
        title="Administrador"
        subtitle="Criação de usuários e permissões de acesso"
      />

      <AdministradorClient />
    </>
  );
}