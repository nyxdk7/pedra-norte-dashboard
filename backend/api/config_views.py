from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import ConfiguracaoSistema
from api.permissions import usuario_eh_administrador


PALETAS_VALIDAS = {
    "msm-industrial",
    "azul-corporativo",
    "verde-engenharia",
    "cinza-tecnico",
    "alto-contraste",
}


def serializar_configuracao(configuracao):
    return {
        "paleta_graficos": configuracao.paleta_graficos,
        "atualizado_em": (
            configuracao.atualizado_em.isoformat()
            if configuracao.atualizado_em
            else None
        ),
    }


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def configuracao_sistema_api(request):
    configuracao = ConfiguracaoSistema.obter_configuracao_global()

    if request.method == "GET":
        return Response(serializar_configuracao(configuracao))

    if not usuario_eh_administrador(request.user):
        return Response(
            {
                "detail": "Você não tem permissão para alterar as configurações do sistema.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    paleta_graficos = str(request.data.get("paleta_graficos", "")).strip()

    if paleta_graficos not in PALETAS_VALIDAS:
        return Response(
            {
                "detail": "Paleta de gráficos inválida.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    configuracao.paleta_graficos = paleta_graficos
    configuracao.save(update_fields=["paleta_graficos", "atualizado_em"])

    return Response(
        {
            "detail": "Configuração salva com sucesso.",
            "configuracao": serializar_configuracao(configuracao),
        }
    )