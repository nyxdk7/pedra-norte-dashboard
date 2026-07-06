from django.db.utils import OperationalError, ProgrammingError

from dashboard.models import Contrato, Medicao
from backend.dashboard.permissions import (
    pode_exportar,
    pode_sincronizar,
    pode_ver_historico,
)


def permissoes_usuario(request):
    usuario = getattr(request, "user", None)

    opcoes_contratos = []
    opcoes_status = []
    opcoes_situacoes = []

    try:
        opcoes_contratos = list(
            Contrato.objects.exclude(
                numero_contrato=""
            ).values_list(
                "numero_contrato",
                flat=True,
            ).distinct().order_by("numero_contrato")
        )

        opcoes_status = list(
            Contrato.objects.exclude(
                status=""
            ).values_list(
                "status",
                flat=True,
            ).distinct().order_by("status")
        )

        opcoes_situacoes = list(
            Medicao.objects.exclude(
                situacao=""
            ).values_list(
                "situacao",
                flat=True,
            ).distinct().order_by("situacao")
        )

    except (OperationalError, ProgrammingError):
        opcoes_contratos = []
        opcoes_status = []
        opcoes_situacoes = []

    return {
        "pode_sincronizar": pode_sincronizar(usuario),
        "pode_exportar": pode_exportar(usuario),
        "pode_ver_historico": pode_ver_historico(usuario),

        "opcoes_contratos": opcoes_contratos,
        "opcoes_status": opcoes_status,
        "opcoes_situacoes": opcoes_situacoes,
    }