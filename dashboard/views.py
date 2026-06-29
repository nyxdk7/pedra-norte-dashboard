import json
from decimal import Decimal
from io import BytesIO

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from dashboard.models import Contrato, Medicao, SincronizacaoHistorico
from dashboard.permissoes import (
    GRUPO_ADMINISTRADOR,
    GRUPO_DIRETORIA,
    GRUPO_FINANCEIRO,
    permissao_grupo_required,
    permissao_grupo_required_json,
)
from dashboard.services.exports.excel_exporter import (
    exportar_contratos_excel,
    exportar_medicoes_excel,
)
from dashboard.services.google_sheets import read_sheet_range
from dashboard.services.importador_contratos import importar_contratos
from dashboard.services.importador_geral import sincronizar_tudo
from dashboard.services.importador_medicoes import importar_medicoes


def decimal_para_float(valor):
    if valor is None:
        return 0

    if isinstance(valor, Decimal):
        return float(valor)

    return float(valor or 0)


def somar_queryset(queryset, campo):
    resultado = queryset.aggregate(total=Sum(campo))
    return resultado["total"] or Decimal("0")


def gerar_dados_por_mes(medicoes_queryset):
    dados_por_mes = {}

    for medicao in medicoes_queryset:
        mes = medicao.mes_ano or "Não informado"

        if mes not in dados_por_mes:
            dados_por_mes[mes] = {
                "medido": Decimal("0"),
                "pago": Decimal("0"),
                "liquidado": Decimal("0"),
                "faturado": Decimal("0"),
                "a_processar": Decimal("0"),
            }

        dados_por_mes[mes]["medido"] += medicao.valor_medido or Decimal("0")
        dados_por_mes[mes]["pago"] += medicao.valor_pago or Decimal("0")
        dados_por_mes[mes]["liquidado"] += medicao.valor_liquidado or Decimal("0")
        dados_por_mes[mes]["faturado"] += medicao.valor_faturado or Decimal("0")
        dados_por_mes[mes]["a_processar"] += medicao.valor_a_processar or Decimal("0")

    labels = list(dados_por_mes.keys())

    valores_medido = [
        decimal_para_float(dados_por_mes[mes]["medido"])
        for mes in labels
    ]

    valores_pago = [
        decimal_para_float(dados_por_mes[mes]["pago"])
        for mes in labels
    ]

    valores_liquidado = [
        decimal_para_float(dados_por_mes[mes]["liquidado"])
        for mes in labels
    ]

    valores_faturado = [
        decimal_para_float(dados_por_mes[mes]["faturado"])
        for mes in labels
    ]

    valores_a_processar = [
        decimal_para_float(dados_por_mes[mes]["a_processar"])
        for mes in labels
    ]

    return {
        "labels": labels,
        "valores_medido": valores_medido,
        "valores_pago": valores_pago,
        "valores_liquidado": valores_liquidado,
        "valores_faturado": valores_faturado,
        "valores_a_processar": valores_a_processar,
    }


@login_required
def home(request):
    contratos_queryset = Contrato.objects.all()
    medicoes_queryset = Medicao.objects.all()

    contrato_filtro = request.GET.get("contrato", "")
    status_filtro = request.GET.get("status", "")
    situacao_filtro = request.GET.get("situacao", "")

    if contrato_filtro:
        contratos_queryset = contratos_queryset.filter(
            numero_contrato__icontains=contrato_filtro
        )
        medicoes_queryset = medicoes_queryset.filter(
            numero_contrato__icontains=contrato_filtro
        )

    if status_filtro:
        contratos_queryset = contratos_queryset.filter(
            status__icontains=status_filtro
        )

    if situacao_filtro:
        medicoes_queryset = medicoes_queryset.filter(
            situacao__icontains=situacao_filtro
        )

    total_contratos = contratos_queryset.count()
    total_medicoes = medicoes_queryset.count()

    total_valor_contratual = somar_queryset(
        contratos_queryset,
        "valor_contratual",
    )
    total_valor_total = somar_queryset(
        contratos_queryset,
        "valor_total",
    )
    total_medido = somar_queryset(
        medicoes_queryset,
        "valor_medido",
    )
    total_pago = somar_queryset(
        medicoes_queryset,
        "valor_pago",
    )
    total_liquidado = somar_queryset(
        medicoes_queryset,
        "valor_liquidado",
    )
    total_faturado = somar_queryset(
        medicoes_queryset,
        "valor_faturado",
    )
    total_a_processar = somar_queryset(
        medicoes_queryset,
        "valor_a_processar",
    )

    percentual_execucao_geral = Decimal("0")

    if total_valor_total and total_valor_total > 0:
        percentual_execucao_geral = (total_medido / total_valor_total) * 100

    dados_mes = gerar_dados_por_mes(medicoes_queryset)

    labels_meses = dados_mes["labels"]
    valores_medido_mes = dados_mes["valores_medido"]
    valores_pago_mes = dados_mes["valores_pago"]
    valores_liquidado_mes = dados_mes["valores_liquidado"]
    valores_faturado_mes = dados_mes["valores_faturado"]
    valores_a_processar_mes = dados_mes["valores_a_processar"]

    contratos_grafico = []
    valores_contratados_grafico = []
    valores_medidos_grafico = []
    percentuais_contratos = []

    for contrato in contratos_queryset:
        total_medido_contrato = medicoes_queryset.filter(
            numero_contrato=contrato.numero_contrato
        ).aggregate(
            total=Sum("valor_medido")
        )["total"] or Decimal("0")

        contratos_grafico.append(contrato.numero_contrato)
        valores_contratados_grafico.append(
            decimal_para_float(contrato.valor_total)
        )
        valores_medidos_grafico.append(
            decimal_para_float(total_medido_contrato)
        )
        percentuais_contratos.append(
            decimal_para_float(contrato.percentual_executado)
        )

    status_contagem = {}

    for contrato in contratos_queryset:
        status_nome = contrato.status or "Não informado"
        status_contagem[status_nome] = status_contagem.get(status_nome, 0) + 1

    situacao_contagem = {}

    for medicao in medicoes_queryset:
        situacao_nome = medicao.situacao or "Não informado"
        situacao_contagem[situacao_nome] = situacao_contagem.get(situacao_nome, 0) + 1

    ultimo_historico = SincronizacaoHistorico.objects.first()

    context = {
        "contratos": contratos_queryset,
        "medicoes": medicoes_queryset,
        "total_contratos": total_contratos,
        "total_medicoes": total_medicoes,
        "total_valor_contratual": total_valor_contratual,
        "total_valor_total": total_valor_total,
        "total_medido": total_medido,
        "total_pago": total_pago,
        "total_liquidado": total_liquidado,
        "total_faturado": total_faturado,
        "total_a_processar": total_a_processar,
        "percentual_execucao_geral": percentual_execucao_geral,
        "ultimo_historico": ultimo_historico,
        "labels_meses": json.dumps(labels_meses, ensure_ascii=False),
        "valores_medido_mes": json.dumps(valores_medido_mes, ensure_ascii=False),
        "valores_pago_mes": json.dumps(valores_pago_mes, ensure_ascii=False),
        "valores_liquidado_mes": json.dumps(valores_liquidado_mes, ensure_ascii=False),
        "valores_faturado_mes": json.dumps(valores_faturado_mes, ensure_ascii=False),
        "valores_a_processar_mes": json.dumps(valores_a_processar_mes, ensure_ascii=False),
        "contratos_grafico": json.dumps(contratos_grafico, ensure_ascii=False),
        "valores_contratados_grafico": json.dumps(
            valores_contratados_grafico,
            ensure_ascii=False,
        ),
        "valores_medidos_grafico": json.dumps(
            valores_medidos_grafico,
            ensure_ascii=False,
        ),
        "percentuais_contratos": json.dumps(
            percentuais_contratos,
            ensure_ascii=False,
        ),
        "labels_status": json.dumps(list(status_contagem.keys()), ensure_ascii=False),
        "valores_status": json.dumps(list(status_contagem.values()), ensure_ascii=False),
        "labels_situacao": json.dumps(list(situacao_contagem.keys()), ensure_ascii=False),
        "valores_situacao": json.dumps(list(situacao_contagem.values()), ensure_ascii=False),
    }

    return render(request, "dashboard/home.html", context)


@login_required
def teste_sheets(request):
    try:
        spreadsheet_id = "1UDfxZbHEtbiIzB7HpxGg-nLSN1aJRrafi7blwiLjVMU"
        range_name = "'Medições'!A1:K5"

        dados = read_sheet_range(
            spreadsheet_id=spreadsheet_id,
            range_name=range_name,
        )

        return JsonResponse(
            {
                "sucesso": True,
                "dados": dados,
            },
            json_dumps_params={"ensure_ascii": False},
        )

    except Exception as erro:
        return JsonResponse(
            {
                "sucesso": False,
                "erro": str(erro),
            },
            status=500,
            json_dumps_params={"ensure_ascii": False},
        )


@permissao_grupo_required(
    [GRUPO_ADMINISTRADOR],
    mensagem="Apenas administradores podem sincronizar a planilha.",
)
def sincronizar_geral(request):
    resultado = sincronizar_tudo(
        usuario=request.user,
        origem="manual",
    )

    if resultado["sucesso"]:
        messages.success(
            request,
            resultado["mensagem"],
        )
    else:
        messages.error(
            request,
            resultado["mensagem"],
        )

    return redirect("home")


@permissao_grupo_required_json(
    [GRUPO_ADMINISTRADOR],
)
def sincronizar_geral_api(request):
    resultado = sincronizar_tudo(
        usuario=request.user,
        origem="automatica_navegador",
    )

    return JsonResponse(
        {
            "sucesso": resultado["sucesso"],
            "total_contratos": resultado["total_contratos"],
            "total_medicoes": resultado["total_medicoes"],
            "mensagem": resultado["mensagem"],
        },
        json_dumps_params={"ensure_ascii": False},
    )


@permissao_grupo_required(
    [GRUPO_ADMINISTRADOR, GRUPO_DIRETORIA],
    mensagem="Apenas administradores e diretoria podem acessar o histórico.",
)
def historico_sincronizacoes(request):
    historicos = SincronizacaoHistorico.objects.select_related(
        "usuario"
    ).all()[:100]

    return render(
        request,
        "dashboard/historico_sincronizacoes.html",
        {
            "historicos": historicos,
        },
    )


@login_required
def contratos(request):
    contratos_queryset = Contrato.objects.all()

    numero_contrato = request.GET.get("contrato", "")
    status = request.GET.get("status", "")

    if numero_contrato:
        contratos_queryset = contratos_queryset.filter(
            numero_contrato__icontains=numero_contrato
        )

    if status:
        contratos_queryset = contratos_queryset.filter(
            status__icontains=status
        )

    total_contratos = contratos_queryset.count()
    total_valor_contratual = somar_queryset(
        contratos_queryset,
        "valor_contratual",
    )
    total_valor_total = somar_queryset(
        contratos_queryset,
        "valor_total",
    )

    numeros_contratos = list(
        contratos_queryset.values_list(
            "numero_contrato",
            flat=True,
        )
    )

    total_medido = Medicao.objects.filter(
        numero_contrato__in=numeros_contratos
    ).aggregate(
        total=Sum("valor_medido")
    )["total"] or Decimal("0")

    context = {
        "contratos": contratos_queryset,
        "total_contratos": total_contratos,
        "total_valor_contratual": total_valor_contratual,
        "total_valor_total": total_valor_total,
        "total_medido": total_medido,
    }

    return render(request, "dashboard/contratos.html", context)


@login_required
def contrato_detalhe(request, numero_contrato):
    contrato = get_object_or_404(
        Contrato,
        numero_contrato=numero_contrato,
    )

    medicoes_queryset = Medicao.objects.filter(
        numero_contrato=numero_contrato,
    )

    situacao = request.GET.get("situacao", "")

    if situacao:
        medicoes_queryset = medicoes_queryset.filter(
            situacao__icontains=situacao
        )

    total_medicoes = medicoes_queryset.count()
    total_medido = somar_queryset(
        medicoes_queryset,
        "valor_medido",
    )
    total_pago = somar_queryset(
        medicoes_queryset,
        "valor_pago",
    )
    total_liquidado = somar_queryset(
        medicoes_queryset,
        "valor_liquidado",
    )
    total_faturado = somar_queryset(
        medicoes_queryset,
        "valor_faturado",
    )
    total_a_processar = somar_queryset(
        medicoes_queryset,
        "valor_a_processar",
    )

    saldo_restante = (contrato.valor_total or Decimal("0")) - total_medido

    percentual_medido = Decimal("0")

    if contrato.valor_total and contrato.valor_total > 0:
        percentual_medido = (total_medido / contrato.valor_total) * 100

    dados_mes = gerar_dados_por_mes(medicoes_queryset)

    context = {
        "contrato": contrato,
        "medicoes": medicoes_queryset,
        "total_medicoes": total_medicoes,
        "total_medido": total_medido,
        "total_pago": total_pago,
        "total_liquidado": total_liquidado,
        "total_faturado": total_faturado,
        "total_a_processar": total_a_processar,
        "saldo_restante": saldo_restante,
        "percentual_medido": percentual_medido,
        "labels_meses": json.dumps(dados_mes["labels"], ensure_ascii=False),
        "valores_medido_mes": json.dumps(
            dados_mes["valores_medido"],
            ensure_ascii=False,
        ),
        "valores_pago_mes": json.dumps(
            dados_mes["valores_pago"],
            ensure_ascii=False,
        ),
        "valores_resumo_contrato": json.dumps(
            [
                decimal_para_float(total_medido),
                decimal_para_float(total_pago),
                decimal_para_float(total_a_processar),
            ],
            ensure_ascii=False,
        ),
    }

    return render(
        request,
        "dashboard/contrato_detalhe.html",
        context,
    )


@login_required
def sincronizar_contratos(request):
    resultado = importar_contratos()

    if resultado.get("sucesso"):
        messages.success(
            request,
            resultado.get("mensagem", "Contratos sincronizados com sucesso."),
        )
    else:
        messages.error(
            request,
            resultado.get("mensagem", "Erro ao sincronizar contratos."),
        )

    return redirect("contratos")


@login_required
def medicoes(request):
    medicoes_queryset = Medicao.objects.all()

    numero_contrato = request.GET.get("contrato", "")
    situacao = request.GET.get("situacao", "")

    if numero_contrato:
        medicoes_queryset = medicoes_queryset.filter(
            numero_contrato__icontains=numero_contrato
        )

    if situacao:
        medicoes_queryset = medicoes_queryset.filter(
            situacao__icontains=situacao
        )

    total_medicoes = medicoes_queryset.count()
    total_valor_medido = somar_queryset(
        medicoes_queryset,
        "valor_medido",
    )
    total_valor_pago = somar_queryset(
        medicoes_queryset,
        "valor_pago",
    )
    total_valor_liquidado = somar_queryset(
        medicoes_queryset,
        "valor_liquidado",
    )
    total_valor_faturado = somar_queryset(
        medicoes_queryset,
        "valor_faturado",
    )
    total_valor_a_processar = somar_queryset(
        medicoes_queryset,
        "valor_a_processar",
    )

    dados_mes = gerar_dados_por_mes(medicoes_queryset)

    context = {
        "medicoes": medicoes_queryset,
        "total_medicoes": total_medicoes,
        "total_valor_medido": total_valor_medido,
        "total_valor_pago": total_valor_pago,
        "total_valor_liquidado": total_valor_liquidado,
        "total_valor_faturado": total_valor_faturado,
        "total_valor_a_processar": total_valor_a_processar,
        "labels_meses": json.dumps(dados_mes["labels"], ensure_ascii=False),
        "valores_medido_mes": json.dumps(
            dados_mes["valores_medido"],
            ensure_ascii=False,
        ),
        "valores_pago_mes": json.dumps(
            dados_mes["valores_pago"],
            ensure_ascii=False,
        ),
    }

    return render(request, "dashboard/medicoes.html", context)


@login_required
def sincronizar_medicoes(request):
    resultado = importar_medicoes()

    if resultado.get("sucesso"):
        messages.success(
            request,
            resultado.get("mensagem", "Medições sincronizadas com sucesso."),
        )
    else:
        messages.error(
            request,
            resultado.get("mensagem", "Erro ao sincronizar medições."),
        )

    return redirect("medicoes")


@permissao_grupo_required(
    [GRUPO_ADMINISTRADOR, GRUPO_DIRETORIA, GRUPO_FINANCEIRO],
    mensagem="Você não tem permissão para exportar relatórios.",
)
def exportar_contratos_excel_view(request):
    contratos_queryset = Contrato.objects.all()

    numero_contrato = request.GET.get("contrato", "")
    status = request.GET.get("status", "")

    if numero_contrato:
        contratos_queryset = contratos_queryset.filter(
            numero_contrato__icontains=numero_contrato
        )

    if status:
        contratos_queryset = contratos_queryset.filter(
            status__icontains=status
        )

    workbook = exportar_contratos_excel(contratos_queryset)

    arquivo = BytesIO()
    workbook.save(arquivo)
    arquivo.seek(0)

    response = HttpResponse(
        arquivo.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="contratos_pedra_norte.xlsx"'

    return response


@permissao_grupo_required(
    [GRUPO_ADMINISTRADOR, GRUPO_DIRETORIA, GRUPO_FINANCEIRO],
    mensagem="Você não tem permissão para exportar relatórios.",
)
def exportar_medicoes_excel_view(request):
    medicoes_queryset = Medicao.objects.all()

    numero_contrato = request.GET.get("contrato", "")
    situacao = request.GET.get("situacao", "")

    if numero_contrato:
        medicoes_queryset = medicoes_queryset.filter(
            numero_contrato__icontains=numero_contrato
        )

    if situacao:
        medicoes_queryset = medicoes_queryset.filter(
            situacao__icontains=situacao
        )

    workbook = exportar_medicoes_excel(medicoes_queryset)

    arquivo = BytesIO()
    workbook.save(arquivo)
    arquivo.seek(0)

    response = HttpResponse(
        arquivo.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="medicoes_pedra_norte.xlsx"'

    return response