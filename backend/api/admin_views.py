from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import Group, User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import PerfilUsuarioSistema
from api.permissions import usuario_eh_administrador


def obter_perfil_usuario(usuario):
    perfil, _ = PerfilUsuarioSistema.objects.get_or_create(
        usuario=usuario,
        defaults={
            "deve_trocar_senha": False,
        },
    )

    return perfil


def serializar_usuario(usuario):
    perfil = obter_perfil_usuario(usuario)

    nome_completo = usuario.get_full_name().strip()

    return {
        "id": usuario.id,
        "username": usuario.username,
        "nome": nome_completo or usuario.username,
        "first_name": usuario.first_name,
        "last_name": usuario.last_name,
        "email": usuario.email,
        "is_active": usuario.is_active,
        "is_superuser": usuario.is_superuser,
        "grupos": list(usuario.groups.values_list("name", flat=True)),
        "deve_trocar_senha": perfil.deve_trocar_senha,
        "date_joined": usuario.date_joined.isoformat() if usuario.date_joined else None,
    }


def separar_nome(nome_completo):
    partes = nome_completo.strip().split()

    if not partes:
        return "", ""

    if len(partes) == 1:
        return partes[0], ""

    return partes[0], " ".join(partes[1:])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def password_status_api(request):
    perfil = obter_perfil_usuario(request.user)

    return Response(
        {
            "deve_trocar_senha": perfil.deve_trocar_senha,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def alterar_senha_obrigatoria_api(request):
    nova_senha = str(request.data.get("nova_senha", "")).strip()
    confirmar_senha = str(request.data.get("confirmar_senha", "")).strip()

    if not nova_senha or not confirmar_senha:
        return Response(
            {
                "detail": "Informe e confirme a nova senha.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if nova_senha != confirmar_senha:
        return Response(
            {
                "detail": "As senhas informadas não conferem.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(nova_senha, request.user)
    except ValidationError as erro:
        return Response(
            {
                "detail": " ".join(erro.messages),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.set_password(nova_senha)
    request.user.save(update_fields=["password"])

    perfil = obter_perfil_usuario(request.user)
    perfil.deve_trocar_senha = False
    perfil.save(update_fields=["deve_trocar_senha", "atualizado_em"])

    update_session_auth_hash(request, request.user)

    return Response(
        {
            "detail": "Senha alterada com sucesso.",
            "deve_trocar_senha": False,
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def usuarios_admin_api(request):
    if not usuario_eh_administrador(request.user):
        return Response(
            {
                "detail": "Você não tem permissão para administrar usuários.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        usuarios = User.objects.all().order_by("first_name", "username")

        return Response(
            {
                "results": [serializar_usuario(usuario) for usuario in usuarios],
            }
        )

    nome = str(request.data.get("nome", "")).strip()
    username = str(request.data.get("username", "")).strip()
    senha_temporaria = str(request.data.get("senha_temporaria", "")).strip()

    if not nome or not username or not senha_temporaria:
        return Response(
            {
                "detail": "Informe nome, usuário e senha temporária.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {
                "detail": "Já existe um usuário com esse login.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    primeiro_nome, sobrenome = separar_nome(nome)

    usuario = User.objects.create_user(
        username=username,
        password=senha_temporaria,
        first_name=primeiro_nome,
        last_name=sobrenome,
        is_active=True,
        is_staff=False,
        is_superuser=False,
    )

    grupo, _ = Group.objects.get_or_create(name="Somente leitura")
    usuario.groups.add(grupo)

    PerfilUsuarioSistema.objects.update_or_create(
        usuario=usuario,
        defaults={
            "deve_trocar_senha": True,
        },
    )

    return Response(
        {
            "detail": "Usuário criado com sucesso.",
            "usuario": serializar_usuario(usuario),
        },
        status=status.HTTP_201_CREATED,
    )