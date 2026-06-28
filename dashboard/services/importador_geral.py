from dashboard.services.importador_contratos import importar_contratos
from dashboard.services.importador_medicoes import importar_medicoes


def sincronizar_tudo():
    resultado_contratos = importar_contratos()
    resultado_medicoes = importar_medicoes()

    sucesso = (
        resultado_contratos.get("sucesso", False)
        and resultado_medicoes.get("sucesso", False)
    )

    return {
        "sucesso": sucesso,
        "contratos": resultado_contratos,
        "medicoes": resultado_medicoes,
        "total_contratos": resultado_contratos.get("total_importado", 0),
        "total_medicoes": resultado_medicoes.get("total_importado", 0),
    }
