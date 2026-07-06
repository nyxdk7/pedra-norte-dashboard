from django.contrib.auth.decorators import user_passes_test
from django.core.exceptions import PermissionDenied

try:
    from rest_framework.permissions import BasePermission
except ImportError:
    class BasePermission:
        message = "Permissão negada."

        def has_permission(self, request, view):
            return False


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


def usuario_pode_visualizar(user):
    if not user or not user.is_authenticated:
        return False

    if usuario_eh_administrador(user):
        return True

    grupos = grupos_do_usuario(user)

    return bool(
        {
            GRUPO_DIRETORIA,
            GRUPO_FINANCEIRO,
            GRUPO_ENGENHARIA,
            GRUPO_SOMENTE_LEITURA,
        }
        & grupos
    )


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


def permissoes_do_usuario(user):
    return {
        "grupos": sorted(list(grupos_do_usuario(user))),
        "is_superuser": bool(user.is_superuser) if user and user.is_authenticated else False,
        "pode_visualizar": usuario_pode_visualizar(user),
        "pode_exportar": usuario_pode_exportar(user),
        "pode_ver_historico": usuario_pode_ver_historico(user),
        "pode_sincronizar": usuario_pode_sincronizar(user),
    }


def permissoes_api_usuario(user):
    return permissoes_do_usuario(user)


class PodeVisualizar(BasePermission):
    message = "Você não tem permissão para visualizar este recurso."

    def has_permission(self, request, view):
        return usuario_pode_visualizar(request.user)


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


def exigir_permissao(condicao, mensagem="Você não tem permissão para acessar este recurso."):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not condicao(request.user):
                raise PermissionDenied(mensagem)

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def exigir_visualizacao(view_func):
    return exigir_permissao(
        usuario_pode_visualizar,
        "Você não tem permissão para visualizar este recurso.",
    )(view_func)


def exigir_exportacao(view_func):
    return exigir_permissao(
        usuario_pode_exportar,
        "Você não tem permissão para exportar dados.",
    )(view_func)


def exigir_historico(view_func):
    return exigir_permissao(
        usuario_pode_ver_historico,
        "Você não tem permissão para visualizar o histórico de sincronizações.",
    )(view_func)


def exigir_sincronizacao(view_func):
    return exigir_permissao(
        usuario_pode_sincronizar,
        "Você não tem permissão para sincronizar a planilha.",
    )(view_func)


def login_e_visualizacao_required(view_func):
    return user_passes_test(usuario_pode_visualizar)(view_func)


def login_e_exportacao_required(view_func):
    return user_passes_test(usuario_pode_exportar)(view_func)


def login_e_historico_required(view_func):
    return user_passes_test(usuario_pode_ver_historico)(view_func)


def login_e_sincronizacao_required(view_func):
    return user_passes_test(usuario_pode_sincronizar)(view_func)


def eh_administrador(user):
    return usuario_eh_administrador(user)


def pode_visualizar(user):
    return usuario_pode_visualizar(user)


def pode_exportar(user):
    return usuario_pode_exportar(user)


def pode_ver_historico(user):
    return usuario_pode_ver_historico(user)


def pode_sincronizar(user):
    return usuario_pode_sincronizar(user)


def tem_permissao_visualizacao(user):
    return usuario_pode_visualizar(user)


def tem_permissao_exportacao(user):
    return usuario_pode_exportar(user)


def tem_permissao_historico(user):
    return usuario_pode_ver_historico(user)


def tem_permissao_sincronizacao(user):
    return usuario_pode_sincronizar(user)