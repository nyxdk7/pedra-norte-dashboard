import { AlterarSenhaObrigatoriaClient } from "@/components/auth/alterar-senha-obrigatoria-client";
import { AppHeader } from "@/components/layout/app-header";

export default function AlterarSenhaPage() {
  return (
    <>
      <AppHeader
        title="Alterar senha"
        subtitle="Defina uma nova senha para continuar usando o sistema"
      />

      <AlterarSenhaObrigatoriaClient />
    </>
  );
}