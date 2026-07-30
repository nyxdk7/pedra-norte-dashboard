from decimal import Decimal, InvalidOperation
import re
import unicodedata

from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import FieldError
from django.shortcuts import get_object_or_404
from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from dashboard.models import Contrato, Medicao

try:
    from dashboard.models import SincronizacaoHistorico
except ImportError:
    SincronizacaoHistorico = None

from .permissions import (
    PodeExportar,
    PodeSincronizar,
    PodeVerHistorico,
    permissoes_api_usuario,
)
from .serializers import (
    ContratoSerializer,
    MedicaoSerializer,
    SincronizacaoHistoricoSerializer,
)


VISOES_MEDICOES = {
    "pendentes",
    "recentes",
    "pagas",
    "historico",
    "todas",
}


def valor_decimal(valor):
    if valor is None:
        return Decimal("0")

    if isinstance(valor, Decimal):
        return valor

    texto = str(valor).strip()

    if not texto:
        return Decimal("0")

    texto = texto.replace("R$", "").replace(" ", "")

    if "," in texto and "." in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif "," in texto:
        texto = texto.replace(",", ".")

    try:
        return Decimal(texto)
    except (InvalidOperation, ValueError):
        return Decimal("0")


def valor_float(valor):
    return float(valor_decimal(valor))


def inteiro_seguro(valor, padrao, minimo, maximo):
    try:
        numero = int(valor)
    except (TypeError, ValueError):
        return padrao

    return max(minimo, min(numero, maximo))


def normalizar_texto(valor):
    texto = str(valor or "").strip().lower()
    texto = unicodedata.normalize("NFKD", texto)

    return "".join(
        caractere
        for caractere in texto
        if not unicodedata.combining(caractere)
    )


def medicao_esta_paga(medicao):
    situacao = normalizar_texto(getattr(medicao, "situacao", ""))

    if any(
        trecho in situacao
        for trecho in (
            "nao pago",
            "nao paga",
            "nao quitado",
            "nao quitada",
            "aguardando pagamento",
            "pendente de pagamento",
        )
    ):
        return False

    return bool(
        re.search(
            r"\b(pago|paga|pagos|pagas|quitado|quitada|quitados|quitadas)\b",
            situacao,
        )
    )


def prioridade_situacao(situacao):
    texto = normalizar_texto(situacao)

    prioridades = [
        ("a processar", 5),
        ("supervisao", 10),
        ("fiscalizacao", 20),
        ("protocol", 30),
        ("fatur", 40),
        ("liquid", 50),
        ("pago", 90),
        ("paga", 90),
        ("quitado", 90),
        ("quitada", 90),
    ]

    for trecho, prioridade in prioridades:
        if trecho in texto:
            return prioridade

    if not texto or texto == "sem situacao":
        return 80

    return 70


MESES_NUMERO = {
    "jan": 1,
    "janeiro": 1,
    "fev": 2,
    "fevereiro": 2,
    "mar": 3,
    "marco": 3,
    "abr": 4,
    "abril": 4,
    "mai": 5,
    "maio": 5,
    "jun": 6,
    "junho": 6,
    "jul": 7,
    "julho": 7,
    "ago": 8,
    "agosto": 8,
    "set": 9,
    "setembro": 9,
    "out": 10,
    "outubro": 10,
    "nov": 11,
    "novembro": 11,
    "dez": 12,
    "dezembro": 12,
}


def normalizar_ano(ano):
    try:
        ano_numero = int(ano)
    except (TypeError, ValueError):
        return 0

    if 0 <= ano_numero <= 99:
        return 2000 + ano_numero

    return ano_numero


def referencia_mes_ano(valor):
    texto_original = str(valor or "").strip()
    texto = normalizar_texto(texto_original)

    if not texto:
        return 0, 0

    correspondencia_numerica = re.search(
        r"\b(0?[1-9]|1[0-2])\s*[/\-.]\s*(\d{2}|\d{4})\b",
        texto,
    )

    if correspondencia_numerica:
        return (
            normalizar_ano(correspondencia_numerica.group(2)),
            int(correspondencia_numerica.group(1)),
        )

    ano_encontrado = re.search(r"\b(20\d{2}|\d{2})\b", texto)
    ano = normalizar_ano(ano_encontrado.group(1)) if ano_encontrado else 0

    for nome_mes, numero_mes in MESES_NUMERO.items():
        if re.search(rf"\b{re.escape(nome_mes)}\b", texto):
            return ano, numero_mes

    return ano, 0


def chave_ordenacao_medicao(medicao):
    ano, mes = referencia_mes_ano(getattr(medicao, "mes_ano", ""))

    return (
        ano,
        mes,
        getattr(medicao, "id", 0) or 0,
    )


def numero_contrato_objeto(obj):
    valor = getattr(obj, "numero_contrato", "")

    if hasattr(valor, "numero_contrato"):
        return str(valor.numero_contrato)

    return str(valor)


def filtrar_contratos_por_numero(queryset, numero_contrato):
    if not numero_contrato:
        return queryset

    try:
        return queryset.filter(
            numero_contrato__icontains=numero_contrato
        )
    except FieldError:
        return queryset.filter(
            numero_contrato__numero_contrato__icontains=numero_contrato
        )


def filtrar_medicoes_por_contrato(queryset, numero_contrato):
    if not numero_contrato:
        return queryset

    try:
        return queryset.filter(
            numero_contrato__icontains=numero_contrato
        )
    except FieldError:
        return queryset.filter(
            numero_contrato__numero_contrato__icontains=numero_contrato
        )


def medicoes_do_contrato(numero_contrato, contrato=None):
    try:
        return Medicao.objects.filter(
            numero_contrato__numero_contrato=numero_contrato
        ).order_by("id")

    except FieldError:
        if contrato is not None:
            try:
                return Medicao.objects.filter(
                    numero_contrato=contrato
                ).order_by("id")

            except (ValueError, TypeError):
                pass

        return Medicao.objects.filter(
            numero_contrato=numero_contrato
        ).order_by("id")


def calcular_totais(contratos, medicoes):
    total_contratado = sum(
        valor_decimal(
            getattr(contrato, "valor_contratual", None)
        )
        or valor_decimal(
            getattr(contrato, "valor_total", None)
        )
        for contrato in contratos
    )

    total_medido = sum(
        valor_decimal(
            getattr(medicao, "valor_medido", None)
        )
        for medicao in medicoes
    )

    total_pago = sum(
        valor_decimal(
            getattr(medicao, "valor_pago", None)
        )
        for medicao in medicoes
    )

    total_liquidado = sum(
        valor_decimal(
            getattr(medicao, "valor_liquidado", None)
        )
        for medicao in medicoes
    )

    total_faturado = sum(
        valor_decimal(
            getattr(medicao, "valor_faturado", None)
        )
        for medicao in medicoes
    )

    total_a_processar = sum(
        valor_decimal(
            getattr(medicao, "valor_a_processar", None)
        )
        for medicao in medicoes
    )

    saldo_estimado = total_contratado - total_medido

    percentual_evolucao = Decimal("0")

    if total_contratado > 0:
        percentual_evolucao = (
            total_medido / total_contratado
        ) * Decimal("100")

    return {
        "total_contratado": float(total_contratado),
        "total_medido": float(total_medido),
        "total_pago": float(total_pago),
        "total_liquidado": float(total_liquidado),
        "total_faturado": float(total_faturado),
        "total_a_processar": float(total_a_processar),
        "saldo_estimado": float(saldo_estimado),
        "percentual_evolucao": float(
            round(percentual_evolucao, 2)
        ),
        "total_contratos": len(contratos),
        "total_medicoes": len(medicoes),
    }


def montar_dashboard(contratos, medicoes):
    totais = calcular_totais(
        contratos,
        medicoes,
    )

    evolucao_mensal = {}
    medicoes_por_situacao = {}
    contratos_por_status = {}
    medido_por_contrato = {}

    for contrato in contratos:
        numero = numero_contrato_objeto(contrato)

        status_contrato = (
            getattr(contrato, "status", "")
            or "Sem status"
        )

        contratos_por_status[status_contrato] = (
            contratos_por_status.get(
                status_contrato,
                0,
            )
            + 1
        )

        medido_por_contrato[numero] = {
            "numero_contrato": numero,
            "empresa": getattr(
                contrato,
                "empresa",
                "",
            ),
            "valor_contratado": valor_float(
                getattr(
                    contrato,
                    "valor_contratual",
                    None,
                )
                or getattr(
                    contrato,
                    "valor_total",
                    None,
                )
            ),
            "valor_medido": 0,
            "percentual_executado": valor_float(
                getattr(
                    contrato,
                    "percentual_executado",
                    None,
                )
            ),
        }

    for medicao in medicoes:
        mes_ano = (
            getattr(medicao, "mes_ano", "")
            or "Sem mês"
        )

        situacao = (
            getattr(medicao, "situacao", "")
            or "Sem situação"
        )

        numero = numero_contrato_objeto(medicao)

        valor_medido = valor_float(
            getattr(
                medicao,
                "valor_medido",
                None,
            )
        )

        evolucao_mensal[mes_ano] = (
            evolucao_mensal.get(mes_ano, 0)
            + valor_medido
        )

        medicoes_por_situacao[situacao] = (
            medicoes_por_situacao.get(
                situacao,
                0,
            )
            + 1
        )

        if numero not in medido_por_contrato:
            medido_por_contrato[numero] = {
                "numero_contrato": numero,
                "empresa": "",
                "valor_contratado": 0,
                "valor_medido": 0,
                "percentual_executado": 0,
            }

        medido_por_contrato[numero][
            "valor_medido"
        ] += valor_medido

    contratado_x_medido = list(
        medido_por_contrato.values()
    )

    ranking_evolucao = sorted(
        contratado_x_medido,
        key=lambda item: item.get(
            "percentual_executado",
            0,
        ),
        reverse=True,
    )

    return {
        "cards": totais,
        "graficos": {
            "evolucao_mensal": [
                {
                    "mes_ano": mes_ano,
                    "valor_medido": valor,
                }
                for mes_ano, valor
                in evolucao_mensal.items()
            ],
            "resumo_financeiro": [
                {
                    "nome": "Contratado",
                    "valor": totais[
                        "total_contratado"
                    ],
                },
                {
                    "nome": "Medido",
                    "valor": totais[
                        "total_medido"
                    ],
                },
                {
                    "nome": "Pago",
                    "valor": totais[
                        "total_pago"
                    ],
                },
                {
                    "nome": "Faturado",
                    "valor": totais[
                        "total_faturado"
                    ],
                },
                {
                    "nome": "A processar",
                    "valor": totais[
                        "total_a_processar"
                    ],
                },
            ],
            "contratado_x_medido": contratado_x_medido,
            "ranking_evolucao": ranking_evolucao,
            "contratos_por_status": [
                {
                    "status": status_contrato,
                    "total": total,
                }
                for status_contrato, total
                in contratos_por_status.items()
            ],
            "medicoes_por_situacao": [
                {
                    "situacao": situacao,
                    "total": total,
                }
                for situacao, total
                in medicoes_por_situacao.items()
            ],
        },
    }


def montar_resumo_situacoes(medicoes):
    resumo = {}

    for medicao in medicoes:
        situacao = (
            str(
                getattr(
                    medicao,
                    "situacao",
                    "",
                )
                or ""
            ).strip()
            or "Sem situação"
        )

        if situacao not in resumo:
            resumo[situacao] = {
                "situacao": situacao,
                "total": 0,
                "total_medido": Decimal("0"),
                "total_liquidado": Decimal("0"),
                "total_pago": Decimal("0"),
                "total_faturado": Decimal("0"),
                "total_a_processar": Decimal("0"),
            }

        item = resumo[situacao]
        item["total"] += 1

        item["total_medido"] += valor_decimal(
            getattr(
                medicao,
                "valor_medido",
                None,
            )
        )

        item["total_liquidado"] += valor_decimal(
            getattr(
                medicao,
                "valor_liquidado",
                None,
            )
        )

        item["total_pago"] += valor_decimal(
            getattr(
                medicao,
                "valor_pago",
                None,
            )
        )

        item["total_faturado"] += valor_decimal(
            getattr(
                medicao,
                "valor_faturado",
                None,
            )
        )

        item["total_a_processar"] += valor_decimal(
            getattr(
                medicao,
                "valor_a_processar",
                None,
            )
        )

    itens = []

    for item in resumo.values():
        itens.append(
            {
                "situacao": item["situacao"],
                "total": item["total"],
                "total_medido": float(
                    item["total_medido"]
                ),
                "total_liquidado": float(
                    item["total_liquidado"]
                ),
                "total_pago": float(
                    item["total_pago"]
                ),
                "total_faturado": float(
                    item["total_faturado"]
                ),
                "total_a_processar": float(
                    item["total_a_processar"]
                ),
            }
        )

    return sorted(
        itens,
        key=lambda item: (
            prioridade_situacao(
                item["situacao"]
            ),
            normalizar_texto(
                item["situacao"]
            ),
        ),
    )


def montar_grupos_situacao(medicoes):
    grupos = {}

    for medicao in medicoes:
        situacao = (
            str(getattr(medicao, "situacao", "") or "").strip()
            or "Sem situação"
        )

        grupos.setdefault(situacao, []).append(medicao)

    resumo = {
        item["situacao"]: item
        for item in montar_resumo_situacoes(medicoes)
    }

    resultado = []

    for situacao, itens in grupos.items():
        resumo_situacao = resumo.get(
            situacao,
            {
                "situacao": situacao,
                "total": len(itens),
                "total_medido": 0,
                "total_liquidado": 0,
                "total_pago": 0,
                "total_faturado": 0,
                "total_a_processar": 0,
            },
        )

        resultado.append(
            {
                **resumo_situacao,
                "items": MedicaoSerializer(itens, many=True).data,
                "total_exibido": len(itens),
            }
        )

    return sorted(
        resultado,
        key=lambda item: (
            prioridade_situacao(item["situacao"]),
            normalizar_texto(item["situacao"]),
        ),
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {
                "detail": "Informe usuário e senha.",
            },
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {
                "detail": "Usuário ou senha inválidos.",
            },
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    if not user.is_active:
        return Response(
            {
                "detail": "Este usuário está inativo.",
            },
            status=drf_status.HTTP_403_FORBIDDEN,
        )

    login(request, user)

    return Response(
        {
            "detail": "Login realizado com sucesso.",
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "permissions": permissoes_api_usuario(
                    user
                ),
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)

    return Response(
        {
            "detail": "Logout realizado com sucesso.",
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_api(request):
    user = request.user

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "permissions": permissoes_api_usuario(
                user
            ),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_api(request):
    numero_contrato = request.GET.get(
        "contrato",
        "",
    ).strip()

    status_contrato = request.GET.get(
        "status",
        "",
    ).strip()

    situacao_medicao = request.GET.get(
        "situacao",
        "",
    ).strip()

    contratos_qs = (
        Contrato.objects.all()
        .order_by("numero_contrato")
    )

    contratos_qs = filtrar_contratos_por_numero(
        contratos_qs,
        numero_contrato,
    )

    if status_contrato:
        contratos_qs = contratos_qs.filter(
            status=status_contrato
        )

    medicoes_qs = (
        Medicao.objects.all()
        .order_by("id")
    )

    medicoes_qs = filtrar_medicoes_por_contrato(
        medicoes_qs,
        numero_contrato,
    )

    if situacao_medicao:
        medicoes_qs = medicoes_qs.filter(
            situacao=situacao_medicao
        )

    contratos = list(contratos_qs)
    medicoes = list(medicoes_qs)

    dados = montar_dashboard(
        contratos,
        medicoes,
    )

    dados["filtros"] = {
        "contrato": numero_contrato,
        "status": status_contrato,
        "situacao": situacao_medicao,
    }

    dados["permissions"] = (
        permissoes_api_usuario(
            request.user
        )
    )

    return Response(dados)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def contratos_api(request):
    numero_contrato = request.GET.get(
        "contrato",
        "",
    ).strip()

    status_contrato = request.GET.get(
        "status",
        "",
    ).strip()

    contratos = (
        Contrato.objects.all()
        .order_by("numero_contrato")
    )

    contratos = filtrar_contratos_por_numero(
        contratos,
        numero_contrato,
    )

    if status_contrato:
        contratos = contratos.filter(
            status=status_contrato
        )

    contratos_lista = list(contratos)

    serializer = ContratoSerializer(
        contratos_lista,
        many=True,
    )

    totais = calcular_totais(
        contratos_lista,
        list(
            Medicao.objects.all()
            .order_by("id")
        ),
    )

    return Response(
        {
            "results": serializer.data,
            "cards": {
                "total_contratos": len(
                    contratos_lista
                ),
                "total_contratado": totais[
                    "total_contratado"
                ],
                "total_medido": totais[
                    "total_medido"
                ],
                "saldo_estimado": totais[
                    "saldo_estimado"
                ],
                "percentual_evolucao": totais[
                    "percentual_evolucao"
                ],
            },
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def contrato_detalhe_api(
    request,
    numero_contrato,
):
    contrato = get_object_or_404(
        Contrato,
        numero_contrato=numero_contrato,
    )

    medicoes_qs = medicoes_do_contrato(
        numero_contrato,
        contrato,
    )

    situacao = request.GET.get(
        "situacao",
        "",
    ).strip()

    if situacao:
        medicoes_qs = medicoes_qs.filter(
            situacao=situacao
        )

    medicoes_lista = list(medicoes_qs)

    contrato_serializer = ContratoSerializer(
        contrato
    )

    medicoes_serializer = MedicaoSerializer(
        medicoes_lista,
        many=True,
    )

    totais = calcular_totais(
        [contrato],
        medicoes_lista,
    )

    dashboard_contrato = montar_dashboard(
        [contrato],
        medicoes_lista,
    )

    return Response(
        {
            "contrato": contrato_serializer.data,
            "cards": totais,
            "graficos": dashboard_contrato[
                "graficos"
            ],
            "medicoes": medicoes_serializer.data,
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicoes_api(request):
    numero_contrato = request.GET.get("contrato", "").strip()
    situacao = request.GET.get("situacao", "").strip()
    mes_ano = request.GET.get("mes_ano", "").strip()
    visao = request.GET.get("visao", "pendentes").strip().lower()

    if visao not in VISOES_MEDICOES:
        visao = "pendentes"

    if visao == "todas":
        visao = "historico"

    limites_padrao = {
        "pendentes": 80,
        "recentes": 40,
        "pagas": 40,
        "historico": 300,
    }

    limite = inteiro_seguro(
        request.GET.get("limite"),
        padrao=limites_padrao[visao],
        minimo=10,
        maximo=500,
    )

    medicoes_qs = Medicao.objects.all()
    medicoes_qs = filtrar_medicoes_por_contrato(
        medicoes_qs,
        numero_contrato,
    )

    medicoes_contrato = sorted(
        list(medicoes_qs),
        key=chave_ordenacao_medicao,
        reverse=True,
    )

    situacoes_disponiveis = sorted(
        {
            str(getattr(item, "situacao", "") or "").strip()
            for item in medicoes_contrato
            if str(getattr(item, "situacao", "") or "").strip()
        },
        key=lambda item: (
            prioridade_situacao(item),
            normalizar_texto(item),
        ),
    )

    meses_disponiveis = sorted(
        {
            str(getattr(item, "mes_ano", "") or "").strip()
            for item in medicoes_contrato
            if str(getattr(item, "mes_ano", "") or "").strip()
        },
        key=referencia_mes_ano,
        reverse=True,
    )

    medicoes_base = medicoes_contrato

    if mes_ano:
        mes_normalizado = normalizar_texto(mes_ano)
        medicoes_base = [
            item
            for item in medicoes_base
            if mes_normalizado
            in normalizar_texto(getattr(item, "mes_ano", ""))
        ]

    if situacao:
        situacao_normalizada = normalizar_texto(situacao)
        medicoes_base = [
            item
            for item in medicoes_base
            if normalizar_texto(getattr(item, "situacao", ""))
            == situacao_normalizada
        ]

    medicoes_pendentes = [
        item
        for item in medicoes_base
        if not medicao_esta_paga(item)
    ]
    medicoes_pagas = [
        item
        for item in medicoes_base
        if medicao_esta_paga(item)
    ]

    if visao == "pendentes":
        medicoes_filtradas = medicoes_pendentes
    elif visao == "pagas":
        medicoes_filtradas = medicoes_pagas
    else:
        medicoes_filtradas = medicoes_base

    total_disponivel = len(medicoes_filtradas)
    medicoes_exibidas = medicoes_filtradas[:limite]

    serializer = MedicaoSerializer(medicoes_exibidas, many=True)
    totais = calcular_totais([], medicoes_exibidas)

    evolucao_mensal = {}

    for medicao in medicoes_exibidas:
        referencia = (
            str(getattr(medicao, "mes_ano", "") or "").strip()
            or "Sem mês"
        )
        valor_medido = valor_float(
            getattr(medicao, "valor_medido", None)
        )
        evolucao_mensal[referencia] = (
            evolucao_mensal.get(referencia, 0)
            + valor_medido
        )

    evolucao_ordenada = sorted(
        evolucao_mensal.items(),
        key=lambda item: referencia_mes_ano(item[0]),
    )

    visoes = [
        {
            "value": "pendentes",
            "label": "Pendentes",
            "total": len(medicoes_pendentes),
        },
        {
            "value": "recentes",
            "label": "Recentes",
            "total": len(medicoes_base),
        },
        {
            "value": "pagas",
            "label": "Pagas",
            "total": len(medicoes_pagas),
        },
        {
            "value": "historico",
            "label": "Histórico",
            "total": len(medicoes_base),
        },
    ]

    return Response(
        {
            "results": serializer.data,
            "cards": {
                "total_medicoes": len(medicoes_exibidas),
                "total_medido": totais["total_medido"],
                "total_pago": totais["total_pago"],
                "total_liquidado": totais["total_liquidado"],
                "total_faturado": totais["total_faturado"],
                "total_a_processar": totais["total_a_processar"],
            },
            "graficos": {
                "evolucao_mensal": [
                    {
                        "mes_ano": referencia,
                        "valor_medido": valor,
                    }
                    for referencia, valor in evolucao_ordenada
                ]
            },
            "resumo_situacoes": montar_resumo_situacoes(
                medicoes_exibidas
            ),
            "grupos_situacao": montar_grupos_situacao(
                medicoes_exibidas
            ),
            "filtros": {
                "contrato": numero_contrato,
                "situacao": situacao,
                "mes_ano": mes_ano,
                "visao": visao,
                "limite": limite,
            },
            "opcoes": {
                "situacoes": situacoes_disponiveis,
                "meses": meses_disponiveis,
                "visoes": visoes,
            },
            "meta": {
                "total_base": len(medicoes_base),
                "total_pendentes": len(medicoes_pendentes),
                "total_pagas": len(medicoes_pagas),
                "total_disponivel": total_disponivel,
                "total_exibido": len(medicoes_exibidas),
                "ocultas_por_limite": max(
                    total_disponivel - len(medicoes_exibidas),
                    0,
                ),
                "pagas_ocultas": (
                    len(medicoes_pagas)
                    if visao == "pendentes"
                    else 0
                ),
                "ordenacao": "mes_ano_mais_recente_primeiro",
            },
            "permissions": permissoes_api_usuario(request.user),
        }
    )


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    PodeVerHistorico,
])
def historico_sincronizacoes_api(request):
    if SincronizacaoHistorico is None:
        return Response(
            {
                "results": [],
                "detail": (
                    "Modelo "
                    "SincronizacaoHistorico "
                    "não encontrado no "
                    "dashboard.models."
                ),
                "permissions": (
                    permissoes_api_usuario(
                        request.user
                    )
                ),
            }
        )

    historico = (
        SincronizacaoHistorico.objects
        .all()
        .order_by("-data_hora")[:100]
    )

    serializer = (
        SincronizacaoHistoricoSerializer(
            historico,
            many=True,
        )
    )

    return Response(
        {
            "results": serializer.data,
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        }
    )


@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    PodeSincronizar,
])
def sincronizar_api(request):
    return Response(
        {
            "detail": (
                "Endpoint da API criado. "
                "Na próxima etapa vamos "
                "conectar aqui a rotina real "
                "de sincronização que já existe "
                "no dashboard."
            ),
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        },
        status=(
            drf_status
            .HTTP_501_NOT_IMPLEMENTED
        ),
    )


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    PodeExportar,
])
def exportar_contratos_excel_api(request):
    return Response(
        {
            "detail": (
                "Endpoint da API criado. "
                "Na próxima etapa vamos "
                "conectar aqui a exportação "
                "real de contratos Excel que "
                "já existe no dashboard."
            ),
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        },
        status=(
            drf_status
            .HTTP_501_NOT_IMPLEMENTED
        ),
    )


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    PodeExportar,
])
def exportar_medicoes_excel_api(request):
    return Response(
        {
            "detail": (
                "Endpoint da API criado. "
                "Na próxima etapa vamos "
                "conectar aqui a exportação "
                "real de medições Excel que "
                "já existe no dashboard."
            ),
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        },
        status=(
            drf_status
            .HTTP_501_NOT_IMPLEMENTED
        ),
    )


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    PodeExportar,
])
def contrato_pdf_api(
    request,
    numero_contrato,
):
    return Response(
        {
            "detail": (
                "Endpoint da API criado. "
                "Na próxima etapa vamos "
                "conectar aqui o PDF real "
                "do contrato que já existe "
                "no dashboard."
            ),
            "numero_contrato": (
                numero_contrato
            ),
            "permissions": (
                permissoes_api_usuario(
                    request.user
                )
            ),
        },
        status=(
            drf_status
            .HTTP_501_NOT_IMPLEMENTED
        ),
    )