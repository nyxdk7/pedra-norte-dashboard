import json
from collections import defaultdict
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone

from .models import Contrato, Medicao
from .services.google_sheets import read_sheet_range
from .services.importador_contratos import importar_contratos
from .services.importador_geral import sincronizar_tudo
from .services.importador_medicoes import importar_medicoes


SPREADSHEET_ID = "1UDfxZbHEtbiIzB7HpxGg-nLSN1aJRrafi7blwiLjVMU"


def formatar_moeda(valor):
    valor = Decimal(valor or 0)

    texto = f"{valor:,.2f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")

    return f"R$ {texto}"


def formatar_percentual(valor):
    valor = Decimal(valor or 0)

    texto = f"{valor:,.2f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")

    return f"{texto}%"


def obter_ultima_sincronizacao_medicoes():
    ultima_medicao_atualizada = (
        Medicao.objects
        .order_by("-atualizado_em")
        .first()
    )

    if not ultima_medicao_atualizada:
        return None

    return timezone.localtime(ultima_medicao_atualizada.atualizado_em)


def obter_ultima_sincronizacao_contratos():
    ultimo_contrato_atualizado = (
        Contrato.objects
        .order_by("-atualizado_em")
        .first()
    )

    if not ultimo_contrato_atualizado:
        return None

    return timezone.localtime(ultimo_contrato_atualizado.atualizado_em)


@login_required
def home(request):
    contrato_filtro = request.GET.get("contrato", "").strip()
    status_filtro = request.GET.get("status", "").strip()
    situacao_filtro = request.GET.get("situacao", "").strip()

    contratos_query = Contrato.objects.all().order_by("numero_contrato")
    medicoes_query = Medicao.objects.all().order_by("id")

    contratos_disponiveis = (
        Contrato.objects
        .exclude(numero_contrato="")
        .values_list("numero_contrato", flat=True)
        .distinct()
        .order_by("numero_contrato")
    )

    status_disponiveis = (
        Contrato.objects
        .exclude(status="")
        .values_list("status", flat=True)
        .distinct()
        .order_by("status")
    )

    situacoes_disponiveis = (
        Medicao.objects
        .exclude(situacao="")
        .values_list("situacao", flat=True)
        .distinct()
        .order_by("situacao")
    )

    if contrato_filtro:
        contratos_query = contratos_query.filter(numero_contrato=contrato_filtro)
        medicoes_query = medicoes_query.filter(numero_contrato=contrato_filtro)

    if status_filtro:
        contratos_query = contratos_query.filter(status=status_filtro)

        contratos_filtrados_por_status = list(
            contratos_query.values_list("numero_contrato", flat=True)
        )

        medicoes_query = medicoes_query.filter(
            numero_contrato__in=contratos_filtrados_por_status
        )

    if situacao_filtro:
        medicoes_query = medicoes_query.filter(situacao=situacao_filtro)

    medicoes = list(medicoes_query)
    contratos = list(contratos_query)

    total_medido = Decimal("0")
    total_pago = Decimal("0")
    total_faturado = Decimal("0")
    total_processar = Decimal("0")
    total_contratado = Decimal("0")

    medido_por_situacao = defaultdict(Decimal)
    contratos_por_status = defaultdict(int)
    medido_por_contrato = defaultdict(Decimal)

    for medicao in medicoes:
        total_medido += medicao.valor_medido
        total_pago += medicao.valor_pago
        total_faturado += medicao.valor_faturado
        total_processar += medicao.valor_a_processar

        situacao = medicao.situacao or "Sem situação"
        medido_por_situacao[situacao] += medicao.valor_medido

        if medicao.numero_contrato:
            medido_por_contrato[medicao.numero_contrato] += medicao.valor_medido

    contratos_para_grafico = []
    evolucao_por_contrato = []

    for contrato in contratos:
        total_contratado += contrato.valor_total

        status = contrato.status or "Sem status"
        contratos_por_status[status] += 1

        valor_medido_contrato = medido_por_contrato[contrato.numero_contrato]

        percentual_evolucao = Decimal("0")

        if contrato.valor_total > 0:
            percentual_evolucao = (
                valor_medido_contrato / contrato.valor_total
            ) * 100

        contratos_para_grafico.append(
            {
                "numero": contrato.numero_contrato,
                "valor_total": contrato.valor_total,
                "valor_medido": valor_medido_contrato,
            }
        )

        evolucao_por_contrato.append(
            {
                "numero": contrato.numero_contrato,
                "percentual": percentual_evolucao,
            }
        )

    saldo_estimado = total_contratado - total_medido

    percentual_evolucao_geral = Decimal("0")

    if total_contratado > 0:
        percentual_evolucao_geral = (total_medido / total_contratado) * 100

    percentual_saldo_geral = Decimal("100") - percentual_evolucao_geral

    if percentual_saldo_geral < 0:
        percentual_saldo_geral = Decimal("0")

    total_medicoes = len(medicoes)
    total_contratos = len(contratos)

    contratos_para_grafico = sorted(
        contratos_para_grafico,
        key=lambda item: item["valor_total"],
        reverse=True,
    )[:8]

    evolucao_por_contrato = sorted(
        evolucao_por_contrato,
        key=lambda item: item["percentual"],
        reverse=True,
    )[:8]

    grafico_resumo_financeiro_labels = [
        "Contratado",
        "Medido",
        "Pago",
        "Saldo estimado",
    ]

    grafico_resumo_financeiro_valores = [
        float(total_contratado),
        float(total_medido),
        float(total_pago),
        float(saldo_estimado),
    ]

    grafico_situacao_labels = list(medido_por_situacao.keys())
    grafico_situacao_valores = [
        float(valor) for valor in medido_por_situacao.values()
    ]

    grafico_status_labels = list(contratos_por_status.keys())
    grafico_status_valores = list(contratos_por_status.values())

    grafico_contratos_labels = [
        item["numero"] for item in contratos_para_grafico
    ]

    grafico_contratos_total = [
        float(item["valor_total"]) for item in contratos_para_grafico
    ]

    grafico_contratos_medido = [
        float(item["valor_medido"]) for item in contratos_para_grafico
    ]

    grafico_evolucao_labels = [
        item["numero"] for item in evolucao_por_contrato
    ]

    grafico_evolucao_valores = [
        round(float(item["percentual"]), 2) for item in evolucao_por_contrato
    ]

    grafico_evolucao_geral_labels = [
        "Executado",
        "Saldo",
    ]

    grafico_evolucao_geral_valores = [
        round(float(percentual_evolucao_geral), 2),
        round(float(percentual_saldo_geral), 2),
    ]

    return render(
        request,
        "dashboard/home.html",
        {
            "total_contratado": formatar_moeda(total_contratado),
            "total_medido": formatar_moeda(total_medido),
            "total_pago": formatar_moeda(total_pago),
            "saldo_estimado": formatar_moeda(saldo_estimado),
            "total_faturado": formatar_moeda(total_faturado),
            "total_processar": formatar_moeda(total_processar),
            "total_medicoes": total_medicoes,
            "total_contratos": total_contratos,
            "percentual_evolucao_geral": formatar_percentual(
                percentual_evolucao_geral
            ),
            "ultima_sincronizacao": obter_ultima_sincronizacao_medicoes(),
            "contrato_filtro": contrato_filtro,
            "status_filtro": status_filtro,
            "situacao_filtro": situacao_filtro,
            "contratos_disponiveis": contratos_disponiveis,
            "status_disponiveis": status_disponiveis,
            "situacoes_disponiveis": situacoes_disponiveis,
            "grafico_resumo_financeiro_labels": json.dumps(
                grafico_resumo_financeiro_labels,
                ensure_ascii=False,
            ),
            "grafico_resumo_financeiro_valores": json.dumps(
                grafico_resumo_financeiro_valores,
            ),
            "grafico_situacao_labels": json.dumps(
                grafico_situacao_labels,
                ensure_ascii=False,
            ),
            "grafico_situacao_valores": json.dumps(
                grafico_situacao_valores,
            ),
            "grafico_status_labels": json.dumps(
                grafico_status_labels,
                ensure_ascii=False,
            ),
            "grafico_status_valores": json.dumps(
                grafico_status_valores,
            ),
            "grafico_contratos_labels": json.dumps(
                grafico_contratos_labels,
                ensure_ascii=False,
            ),
            "grafico_contratos_total": json.dumps(
                grafico_contratos_total,
            ),
            "grafico_contratos_medido": json.dumps(
                grafico_contratos_medido,
            ),
            "grafico_evolucao_labels": json.dumps(
                grafico_evolucao_labels,
                ensure_ascii=False,
            ),
            "grafico_evolucao_valores": json.dumps(
                grafico_evolucao_valores,
            ),
            "grafico_evolucao_geral_labels": json.dumps(
                grafico_evolucao_geral_labels,
                ensure_ascii=False,
            ),
            "grafico_evolucao_geral_valores": json.dumps(
                grafico_evolucao_geral_valores,
            ),
        },
    )


@login_required
def teste_sheets(request):
    dados = read_sheet_range(
        spreadsheet_id=SPREADSHEET_ID,
        range_name="'Medições'!A1:K500",
    )

    return JsonResponse(
        {
            "total_linhas": len(dados),
            "dados": dados,
        },
        json_dumps_params={"ensure_ascii": False},
    )


@login_required
def sincronizar_geral(request):
    resultado = sincronizar_tudo()

    if resultado["sucesso"]:
        messages.success(
            request,
            f"Sincronização concluída: "
            f"{resultado['total_contratos']} contratos e "
            f"{resultado['total_medicoes']} medições atualizadas.",
        )
    else:
        messages.error(
            request,
            "Não foi possível concluir a sincronização geral.",
        )

    return redirect("home")


@login_required
def sincronizar_geral_api(request):
    resultado = sincronizar_tudo()

    return JsonResponse(
        {
            "sucesso": resultado["sucesso"],
            "total_contratos": resultado["total_contratos"],
            "total_medicoes": resultado["total_medicoes"],
        },
        json_dumps_params={"ensure_ascii": False},
    )


@login_required
def sincronizar_medicoes(request):
    resultado = importar_medicoes()

    if resultado["sucesso"]:
        messages.success(
            request,
            f"{resultado['total_importado']} medições sincronizadas com sucesso.",
        )
    else:
        messages.error(
            request,
            resultado["mensagem"],
        )

    return redirect("medicoes")


@login_required
def sincronizar_contratos(request):
    resultado = importar_contratos()

    if resultado["sucesso"]:
        messages.success(
            request,
            f"{resultado['total_importado']} contratos sincronizados com sucesso.",
        )
    else:
        messages.error(
            request,
            resultado["mensagem"],
        )

    return redirect("contratos")


@login_required
def contratos(request):
    contrato_filtro = request.GET.get("contrato", "").strip()
    status_filtro = request.GET.get("status", "").strip()

    contratos_query = Contrato.objects.all().order_by("numero_contrato")

    contratos_disponiveis = (
        Contrato.objects
        .exclude(numero_contrato="")
        .values_list("numero_contrato", flat=True)
        .distinct()
        .order_by("numero_contrato")
    )

    status_disponiveis = (
        Contrato.objects
        .exclude(status="")
        .values_list("status", flat=True)
        .distinct()
        .order_by("status")
    )

    if contrato_filtro:
        contratos_query = contratos_query.filter(numero_contrato=contrato_filtro)

    if status_filtro:
        contratos_query = contratos_query.filter(status=status_filtro)

    contratos_lista = []

    total_contratado = Decimal("0")
    total_medido = Decimal("0")
    total_saldo = Decimal("0")

    for contrato in contratos_query:
        medido_contrato = Decimal("0")

        medicoes_contrato = Medicao.objects.filter(
            numero_contrato=contrato.numero_contrato
        )

        for medicao in medicoes_contrato:
            medido_contrato += medicao.valor_medido

        saldo = contrato.valor_total - medido_contrato

        total_contratado += contrato.valor_total
        total_medido += medido_contrato
        total_saldo += saldo

        contratos_lista.append(
            {
                "numero_contrato": contrato.numero_contrato,
                "empresa": contrato.empresa,
                "objeto": contrato.objeto,
                "valor_total": formatar_moeda(contrato.valor_total),
                "valor_medido": formatar_moeda(medido_contrato),
                "saldo": formatar_moeda(saldo),
                "status": contrato.status,
                "percentual_executado": formatar_percentual(
                    contrato.percentual_executado
                ),
                "data_inicio": contrato.data_inicio,
                "data_fim": contrato.data_fim,
            }
        )

    return render(
        request,
        "dashboard/contratos.html",
        {
            "contratos": contratos_lista,
            "total_contratos": len(contratos_lista),
            "total_contratado": formatar_moeda(total_contratado),
            "total_medido": formatar_moeda(total_medido),
            "total_saldo": formatar_moeda(total_saldo),
            "contrato_filtro": contrato_filtro,
            "status_filtro": status_filtro,
            "contratos_disponiveis": contratos_disponiveis,
            "status_disponiveis": status_disponiveis,
            "ultima_sincronizacao": obter_ultima_sincronizacao_contratos(),
        },
    )


@login_required
def contrato_detalhe(request, numero_contrato):
    contrato = Contrato.objects.filter(
        numero_contrato=numero_contrato
    ).first()

    if not contrato:
        messages.error(
            request,
            "Contrato não encontrado.",
        )
        return redirect("contratos")

    medicoes = (
        Medicao.objects
        .filter(numero_contrato=numero_contrato)
        .order_by("id")
    )

    total_medido = Decimal("0")
    total_pago = Decimal("0")
    total_faturado = Decimal("0")
    total_processar = Decimal("0")

    medido_por_mes = defaultdict(Decimal)
    pago_por_mes = defaultdict(Decimal)

    linhas_medicoes = []

    for medicao in medicoes:
        total_medido += medicao.valor_medido
        total_pago += medicao.valor_pago
        total_faturado += medicao.valor_faturado
        total_processar += medicao.valor_a_processar

        mes_ano = medicao.mes_ano or "Sem mês"

        medido_por_mes[mes_ano] += medicao.valor_medido
        pago_por_mes[mes_ano] += medicao.valor_pago

        linhas_medicoes.append(
            {
                "numero_medicao": medicao.numero_medicao,
                "mes_ano": medicao.mes_ano,
                "valor_medido": formatar_moeda(medicao.valor_medido),
                "valor_pago": formatar_moeda(medicao.valor_pago),
                "valor_liquidado": formatar_moeda(medicao.valor_liquidado),
                "valor_faturado": formatar_moeda(medicao.valor_faturado),
                "valor_a_processar": formatar_moeda(medicao.valor_a_processar),
                "data_pagamento": medicao.data_pagamento,
                "data_faturamento": medicao.data_faturamento,
                "situacao": medicao.situacao,
            }
        )

    saldo_estimado = contrato.valor_total - total_medido

    percentual_evolucao = Decimal("0")

    if contrato.valor_total > 0:
        percentual_evolucao = (total_medido / contrato.valor_total) * 100

    percentual_saldo = Decimal("100") - percentual_evolucao

    if percentual_saldo < 0:
        percentual_saldo = Decimal("0")

    grafico_meses = list(medido_por_mes.keys())

    grafico_medido_mensal = [
        float(valor) for valor in medido_por_mes.values()
    ]

    grafico_pago_mensal = [
        float(pago_por_mes[mes]) for mes in grafico_meses
    ]

    grafico_evolucao_labels = [
        "Executado",
        "Saldo",
    ]

    grafico_evolucao_valores = [
        round(float(percentual_evolucao), 2),
        round(float(percentual_saldo), 2),
    ]

    return render(
        request,
        "dashboard/contrato_detalhe.html",
        {
            "contrato": contrato,
            "total_medido": formatar_moeda(total_medido),
            "total_pago": formatar_moeda(total_pago),
            "total_faturado": formatar_moeda(total_faturado),
            "total_processar": formatar_moeda(total_processar),
            "saldo_estimado": formatar_moeda(saldo_estimado),
            "valor_total": formatar_moeda(contrato.valor_total),
            "percentual_evolucao": formatar_percentual(percentual_evolucao),
            "total_medicoes": medicoes.count(),
            "linhas_medicoes": linhas_medicoes,
            "ultima_sincronizacao": obter_ultima_sincronizacao_medicoes(),
            "grafico_meses": json.dumps(
                grafico_meses,
                ensure_ascii=False,
            ),
            "grafico_medido_mensal": json.dumps(
                grafico_medido_mensal,
            ),
            "grafico_pago_mensal": json.dumps(
                grafico_pago_mensal,
            ),
            "grafico_evolucao_labels": json.dumps(
                grafico_evolucao_labels,
                ensure_ascii=False,
            ),
            "grafico_evolucao_valores": json.dumps(
                grafico_evolucao_valores,
            ),
        },
    )


@login_required
def medicoes(request):
    contrato_filtro = request.GET.get("contrato", "").strip()
    situacao_filtro = request.GET.get("situacao", "").strip()

    medicoes_query = Medicao.objects.all().order_by("id")

    contratos_disponiveis = (
        Medicao.objects
        .exclude(numero_contrato="")
        .values_list("numero_contrato", flat=True)
        .distinct()
        .order_by("numero_contrato")
    )

    situacoes_disponiveis = (
        Medicao.objects
        .exclude(situacao="")
        .values_list("situacao", flat=True)
        .distinct()
        .order_by("situacao")
    )

    if contrato_filtro:
        medicoes_query = medicoes_query.filter(numero_contrato=contrato_filtro)

    if situacao_filtro:
        medicoes_query = medicoes_query.filter(situacao=situacao_filtro)

    medicoes = list(medicoes_query)

    total_medido = Decimal("0")
    total_pago = Decimal("0")
    total_faturado = Decimal("0")
    total_processar = Decimal("0")

    medido_por_mes = defaultdict(Decimal)

    linhas = []

    for medicao in medicoes:
        total_medido += medicao.valor_medido
        total_pago += medicao.valor_pago
        total_faturado += medicao.valor_faturado
        total_processar += medicao.valor_a_processar

        if medicao.mes_ano:
            medido_por_mes[medicao.mes_ano] += medicao.valor_medido

        linhas.append(
            [
                medicao.numero_medicao,
                medicao.numero_contrato,
                medicao.mes_ano,
                formatar_moeda(medicao.valor_medido),
                formatar_moeda(medicao.valor_pago),
                medicao.data_pagamento,
                formatar_moeda(medicao.valor_liquidado),
                formatar_moeda(medicao.valor_faturado),
                medicao.data_faturamento,
                formatar_moeda(medicao.valor_a_processar),
                medicao.situacao,
            ]
        )

    cabecalho = [
        "Nº Medição",
        "Nº Contrato",
        "Mês/Ano",
        "Valor Medido (R$)",
        "Valor Pago (R$)",
        "Data Pagamento",
        "Valor Liquidado (R$)",
        "Valor Faturado (R$)",
        "Data Faturamento",
        "Medições a Processar (R$)",
        "Situação",
    ]

    grafico_labels = list(medido_por_mes.keys())
    grafico_valores = [float(valor) for valor in medido_por_mes.values()]

    return render(
        request,
        "dashboard/medicoes.html",
        {
            "total_linhas": len(linhas),
            "cabecalho": cabecalho,
            "linhas": linhas,
            "contrato_filtro": contrato_filtro,
            "situacao_filtro": situacao_filtro,
            "contratos_disponiveis": contratos_disponiveis,
            "situacoes_disponiveis": situacoes_disponiveis,
            "ultima_sincronizacao": obter_ultima_sincronizacao_medicoes(),
            "total_medido": formatar_moeda(total_medido),
            "total_pago": formatar_moeda(total_pago),
            "total_faturado": formatar_moeda(total_faturado),
            "total_processar": formatar_moeda(total_processar),
            "grafico_labels": json.dumps(grafico_labels, ensure_ascii=False),
            "grafico_valores": json.dumps(grafico_valores),
        },
    )
