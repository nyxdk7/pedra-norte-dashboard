from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect


GRUPO_ADMINISTRADOR = "Administrador"
GRUPO_DIRETORIA = "Diretoria"
GRUPO_FINANCEIRO = "Financeiro"
GRUPO_ENGENHARIA = "Engenharia"
GRUPO_SOMENTE_LEITURA = "Somente leitura"


def usuario_tem_grupo(usuario, grupos):
    if not usuario or not usuario.is_authenticated:
        return False

    if usuario.is_superuser:
        return True

    return usuario.groups.filter(name__in=grupos).exists()


def pode_sincronizar(usuario):
    return usuario_tem_grupo(
        usuario,
        [
            GRUPO_ADMINISTRADOR,
        ],
    )


def pode_exportar(usuario):
    return usuario_tem_grupo(
        usuario,
        [
            GRUPO_ADMINISTRADOR,
            GRUPO_DIRETORIA,
            GRUPO_FINANCEIRO,
        ],
    )


def pode_ver_historico(usuario):
    return usuario_tem_grupo(
        usuario,
        [
            GRUPO_ADMINISTRADOR,
            GRUPO_DIRETORIA,
        ],
    )


def permissao_grupo_required(grupos, mensagem=None):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapper(request, *args, **kwargs):
            if usuario_tem_grupo(request.user, grupos):
                return view_func(request, *args, **kwargs)

            messages.error(
                request,
                mensagem or "Você não tem permissão para acessar esta área.",
            )

            return redirect("home")

        return wrapper

    return decorator


def permissao_grupo_required_json(grupos):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapper(request, *args, **kwargs):
            if usuario_tem_grupo(request.user, grupos):
                return view_func(request, *args, **kwargs)

            return JsonResponse(
                {
                    "sucesso": False,
                    "mensagem": "Você não tem permissão para executar esta ação.",
                },
                status=403,
                json_dumps_params={"ensure_ascii": False},
            )

        return wrapper

    return decorator