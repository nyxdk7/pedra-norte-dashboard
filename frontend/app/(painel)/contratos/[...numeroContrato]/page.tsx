import { ContratoDetalheClient } from "@/components/contratos/contrato-detalhe-client";
import { AppHeader } from "@/components/layout/app-header";

type ContratoDetalhePageProps = {
  params: Promise<{
    numeroContrato: string[];
  }>;
};

export default async function ContratoDetalhePage({
  params,
}: ContratoDetalhePageProps) {
  const { numeroContrato } = await params;

  const numeroContratoDecodificado = decodeURIComponent(
    numeroContrato.join("/"),
  );

  return (
    <>
      <AppHeader
        title={`Contrato ${numeroContratoDecodificado}`}
        subtitle="Detalhes financeiros, medições e evolução do contrato"
        section="Detalhe do contrato"
      />

      <ContratoDetalheClient numeroContrato={numeroContratoDecodificado} />
    </>
  );
}