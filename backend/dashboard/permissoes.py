from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse

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


def normalizar_grupos(*grupos):
    grupos_normalizados = []

    for grupo in grupos:
        if grupo is None:
            continue

        if isinstance(grupo, (list, tuple, set)):
            grupos_normalizados.extend([str(item) for item in grupo])
        else:
            grupos_normalizados.append(str(grupo))

    return set(grupos_normalizados)


def usuario_tem_grupo(user, *grupos):
    if not user or not user.is_authenticated:
        return False

    if usuario_eh_administrador(user):
        return True

    grupos_permitidos = normalizar_grupos(*grupos)

    if not grupos_permitidos:
        return False

    return bool(grupos_do_usuario(user) & grupos_permitidos)


def usuario_pode_visualizar(user):
    if not user or not user.is_authenticated:
        return False

    if usuario_eh_administrador(user):
        return True

    return usuario_tem_grupo(
        user,
        GRUPO_DIRETORIA,
        GRUPO_FINANCEIRO,
        GRUPO_ENGENHARIA,
        GRUPO_SOMENTE_LEITURA,
    )


def usuario_pode_exportar(user):
    if not user or not user.is_authenticated:
        return False

    if usuario_eh_administrador(user):
        return True

    return usuario_tem_grupo(
        user,
        GRUPO_DIRETORIA,
        GRUPO_FINANCEIRO,
    )


def usuario_pode_ver_historico(user):
    if not user or not user.is_authenticated:
        return False

    if usuario_eh_administrador(user):
        return True

    return usuario_tem_grupo(
        user,
        GRUPO_DIRETORIA,
    )


def usuario_pode_sincronizar(user):
    if not user or not user.is_authenticated:
        return False

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


def permissao_grupo_required(*grupos_permitidos, mensagem="Você não tem permissão para acessar este recurso."):
    grupos_permitidos = normalizar_grupos(*grupos_permitidos)

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapper(request, *args, **kwargs):
            if usuario_tem_grupo(request.user, grupos_permitidos):
                return view_func(request, *args, **kwargs)

            raise PermissionDenied(mensagem)

        return wrapper

    return decorator


def permissao_grupo_required_json(*grupos_permitidos, mensagem="Você não tem permissão para acessar este recurso."):
    grupos_permitidos = normalizar_grupos(*grupos_permitidos)

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return JsonResponse(
                    {
                        "sucesso": False,
                        "mensagem": "Usuário não autenticado.",
                    },
                    status=401,
                    json_dumps_params={"ensure_ascii": False},
                )

            if usuario_tem_grupo(request.user, grupos_permitidos):
                return view_func(request, *args, **kwargs)

            return JsonResponse(
                {
                    "sucesso": False,
                    "mensagem": mensagem,
                },
                status=403,
                json_dumps_params={"ensure_ascii": False},
            )

        return wrapper

    return decorator


def exigir_permissao(condicao, mensagem="Você não tem permissão para acessar este recurso."):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
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
    return exigir_visualizacao(view_func)


def login_e_exportacao_required(view_func):
    return exigir_exportacao(view_func)


def login_e_historico_required(view_func):
    return exigir_historico(view_func)


def login_e_sincronizacao_required(view_func):
    return exigir_sincronizacao(view_func)


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


grupo_required = permissao_grupo_required
permissao_required = permissao_grupo_required
grupo_required_json = permissao_grupo_required_json
permissao_required_json = permissao_grupo_required_json