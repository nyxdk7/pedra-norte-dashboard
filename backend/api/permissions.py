from rest_framework.permissions import BasePermission


GRUPO_ADMINISTRADOR = "Administrador"
GRUPO_DIRETORIA = "Diretoria"
GRUPO_FINANCEIRO = "Financeiro"
GRUPO_ENGENHARIA = "Engenharia"
GRUPO_SOMENTE_LEITURA = "Somente leitura"


def grupos_do_usuario(user):
    if not user or not user.is_authenticated:
        return set()

    return set(user.groups.values_list("name", flat=True))


def usuario_eh_administrador(user):
    if not user or not user.is_authenticated:
        return False

    return user.is_superuser or GRUPO_ADMINISTRADOR in grupos_do_usuario(user)


def usuario_pode_exportar(user):
    if usuario_eh_administrador(user):
        return True

    grupos = grupos_do_usuario(user)

    return bool(
        {
            GRUPO_DIRETORIA,
            GRUPO_FINANCEIRO,
        }
        & grupos
    )


def usuario_pode_ver_historico(user):
    if usuario_eh_administrador(user):
        return True

    grupos = grupos_do_usuario(user)

    return GRUPO_DIRETORIA in grupos


def usuario_pode_sincronizar(user):
    return usuario_eh_administrador(user)


def permissoes_api_usuario(user):
    grupos = sorted(list(grupos_do_usuario(user)))

    return {
        "grupos": grupos,
        "is_superuser": bool(user.is_superuser) if user and user.is_authenticated else False,
        "pode_exportar": usuario_pode_exportar(user),
        "pode_ver_historico": usuario_pode_ver_historico(user),
        "pode_sincronizar": usuario_pode_sincronizar(user),
    }


class PodeExportar(BasePermission):
    message = "Você não tem permissão para exportar dados."

    def has_permission(self, request, view):
        return usuario_pode_exportar(request.user)


class PodeVerHistorico(BasePermission):
    message = "Você não tem permissão para visualizar o histórico de sincronizações."

    def has_permission(self, request, view):
        return usuario_pode_ver_historico(request.user)


class PodeSincronizar(BasePermission):
    message = "Você não tem permissão para sincronizar a planilha."

    def has_permission(self, request, view):
        return usuario_pode_sincronizar(request.user)