from dashboard.models import SincronizacaoHistorico
from dashboard.services.importador_contratos import importar_contratos
from dashboard.services.importador_medicoes import importar_medicoes


def sincronizar_tudo(usuario=None, origem="manual"):
    total_contratos = 0
    total_medicoes = 0

    try:
        resultado_contratos = importar_contratos()
        resultado_medicoes = importar_medicoes()

        total_contratos = resultado_contratos.get("total_importado", 0)
        total_medicoes = resultado_medicoes.get("total_importado", 0)

        sucesso = (
            resultado_contratos.get("sucesso", False)
            and resultado_medicoes.get("sucesso", False)
        )

        if sucesso:
            status = "sucesso"
            mensagem = (
                f"Sincronização concluída: "
                f"{total_contratos} contratos e "
                f"{total_medicoes} medições atualizadas."
            )
        else:
            status = "erro"
            mensagem = (
                f"Contratos: {resultado_contratos.get('mensagem', '')} | "
                f"Medições: {resultado_medicoes.get('mensagem', '')}"
            )

        SincronizacaoHistorico.objects.create(
            usuario=usuario if getattr(usuario, "is_authenticated", False) else None,
            origem=origem,
            status=status,
            total_contratos=total_contratos,
            total_medicoes=total_medicoes,
            mensagem=mensagem,
        )

        return {
            "sucesso": sucesso,
            "contratos": resultado_contratos,
            "medicoes": resultado_medicoes,
            "total_contratos": total_contratos,
            "total_medicoes": total_medicoes,
            "mensagem": mensagem,
        }

    except Exception as erro:
        mensagem = f"Erro ao sincronizar: {erro}"

        SincronizacaoHistorico.objects.create(
            usuario=usuario if getattr(usuario, "is_authenticated", False) else None,
            origem=origem,
            status="erro",
            total_contratos=total_contratos,
            total_medicoes=total_medicoes,
            mensagem=mensagem,
        )

        return {
            "sucesso": False,
            "contratos": {},
            "medicoes": {},
            "total_contratos": total_contratos,
            "total_medicoes": total_medicoes,
            "mensagem": mensagem,
        }