from collections import defaultdict
from decimal import Decimal, InvalidOperation
from io import BytesIO

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from dashboard.models import Contrato, Medicao


COR_PRINCIPAL = colors.HexColor("#111827")
COR_TEXTO = colors.HexColor("#0f172a")
COR_TEXTO_FRACO = colors.HexColor("#64748b")
COR_BORDA = colors.HexColor("#e2e8f0")
COR_FUNDO_CABECALHO = colors.HexColor("#f1f5f9")
COR_FUNDO_CARD = colors.HexColor("#f8fafc")


def _decimal(valor):
    if valor is None:
        return Decimal("0")

    if isinstance(valor, Decimal):
        return valor

    texto = str(valor).strip()

    if not texto:
        return Decimal("0")

    texto = (
        texto.replace("R$", "")
        .replace("%", "")
        .replace(" ", "")
        .replace(".", "")
        .replace(",", ".")
    )

    try:
        return Decimal(texto)
    except (InvalidOperation, ValueError):
        return Decimal("0")


def _valor_objeto(objeto, nomes_campos):
    for nome in nomes_campos:
        if hasattr(objeto, nome):
            return _decimal(getattr(objeto, nome))

    return Decimal("0")


def _valor_contrato(contrato):
    return _valor_objeto(
        contrato,
        [
            "valor_total",
            "valor_contratual",
            "valor_contrato",
            "valor_contratado",
        ],
    )


def _valor_medicao(medicao, campo):
    return _valor_objeto(medicao, [campo])


def _formatar_moeda(valor):
    valor = _decimal(valor)
    texto = f"{valor:,.2f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {texto}"


def _formatar_percentual(valor):
    valor = _decimal(valor)
    texto = f"{valor:,.2f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{texto}%"


def _texto(valor, padrao="-"):
    if valor is None:
        return padrao

    texto = str(valor).strip()

    return texto or padrao


def _formatar_filtro(valor):
    return _texto(valor, "Todos")


def _montar_estilos():
    estilos_base = getSampleStyleSheet()

    return {
        "titulo": ParagraphStyle(
            "TituloRelatorio",
            parent=estilos_base["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=COR_TEXTO,
            spaceAfter=6,
        ),
        "subtitulo": ParagraphStyle(
            "SubtituloRelatorio",
            parent=estilos_base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=COR_TEXTO_FRACO,
            spaceAfter=14,
        ),
        "secao": ParagraphStyle(
            "SecaoRelatorio",
            parent=estilos_base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=COR_TEXTO,
            spaceBefore=10,
            spaceAfter=8,
        ),
        "normal": ParagraphStyle(
            "NormalRelatorio",
            parent=estilos_base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=COR_TEXTO,
        ),
        "normal_cinza": ParagraphStyle(
            "NormalCinzaRelatorio",
            parent=estilos_base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=COR_TEXTO_FRACO,
        ),
        "card_label": ParagraphStyle(
            "CardLabelRelatorio",
            parent=estilos_base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=9,
            textColor=COR_TEXTO_FRACO,
            alignment=TA_CENTER,
        ),
        "card_valor": ParagraphStyle(
            "CardValorRelatorio",
            parent=estilos_base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=COR_TEXTO,
            alignment=TA_CENTER,
        ),
        "direita": ParagraphStyle(
            "DireitaRelatorio",
            parent=estilos_base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=COR_TEXTO,
            alignment=TA_RIGHT,
        ),
    }


def _p(texto, estilo):
    texto_seguro = _texto(texto).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(texto_seguro, estilo)


def _tabela(dados, larguras=None, repetir_cabecalho=True):
    tabela = Table(
        dados,
        colWidths=larguras,
        repeatRows=1 if repetir_cabecalho else 0,
        hAlign="LEFT",
    )

    tabela.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), COR_FUNDO_CABECALHO),
                ("TEXTCOLOR", (0, 0), (-1, 0), COR_TEXTO),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
                ("TOPPADDING", (0, 0), (-1, 0), 7),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 7),
                ("TEXTCOLOR", (0, 1), (-1, -1), COR_TEXTO),
                ("GRID", (0, 0), (-1, -1), 0.5, COR_BORDA),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 1), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ]
        )
    )

    return tabela


def _card(label, valor, estilos):
    tabela = Table(
        [
            [_p(label, estilos["card_label"])],
            [_p(valor, estilos["card_valor"])],
        ],
        colWidths=[5.3 * cm],
    )

    tabela.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COR_FUNDO_CARD),
                ("BOX", (0, 0), (-1, -1), 0.7, COR_BORDA),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    return tabela


def _cabecalho_rodape(canvas, doc):
    canvas.saveState()

    largura, _ = A4

    canvas.setFillColor(COR_PRINCIPAL)
    canvas.rect(0, 0, largura, 0.45 * cm, fill=1, stroke=0)

    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(1.5 * cm, 0.16 * cm, "MSM Industrial - Relatório interno")

    canvas.drawRightString(
        largura - 1.5 * cm,
        0.16 * cm,
        f"Página {doc.page}",
    )

    canvas.restoreState()


def _aplicar_filtros(request):
    contrato_filtro = request.GET.get("contrato", "").strip()
    status_filtro = request.GET.get("status", "").strip()
    situacao_filtro = request.GET.get("situacao", "").strip()

    contratos = Contrato.objects.all().order_by("numero_contrato")
    medicoes = Medicao.objects.all().order_by("numero_contrato", "mes_ano", "numero_medicao")

    if contrato_filtro:
        contratos = contratos.filter(numero_contrato=contrato_filtro)
        medicoes = medicoes.filter(numero_contrato=contrato_filtro)

    if status_filtro:
        contratos = contratos.filter(status=status_filtro)

        numeros_contratos = list(
            contratos.values_list("numero_contrato", flat=True)
        )

        medicoes = medicoes.filter(numero_contrato__in=numeros_contratos)

    if situacao_filtro:
        medicoes = medicoes.filter(situacao=situacao_filtro)

    return {
        "contratos": contratos,
        "medicoes": medicoes,
        "filtros": {
            "contrato": contrato_filtro,
            "status": status_filtro,
            "situacao": situacao_filtro,
        },
    }


def _montar_resumo(contratos, medicoes):
    total_contratado = sum((_valor_contrato(item) for item in contratos), Decimal("0"))
    total_medido = sum(
        (_valor_medicao(item, "valor_medido") for item in medicoes),
        Decimal("0"),
    )
    total_pago = sum(
        (_valor_medicao(item, "valor_pago") for item in medicoes),
        Decimal("0"),
    )
    total_liquidado = sum(
        (_valor_medicao(item, "valor_liquidado") for item in medicoes),
        Decimal("0"),
    )
    total_faturado = sum(
        (_valor_medicao(item, "valor_faturado") for item in medicoes),
        Decimal("0"),
    )
    total_a_processar = sum(
        (_valor_medicao(item, "valor_a_processar") for item in medicoes),
        Decimal("0"),
    )

    saldo_estimado = total_contratado - total_medido

    percentual_evolucao = Decimal("0")

    if total_contratado:
        percentual_evolucao = (total_medido / total_contratado) * Decimal("100")

    return {
        "total_contratado": total_contratado,
        "total_medido": total_medido,
        "total_pago": total_pago,
        "total_liquidado": total_liquidado,
        "total_faturado": total_faturado,
        "total_a_processar": total_a_processar,
        "saldo_estimado": saldo_estimado,
        "percentual_evolucao": percentual_evolucao,
        "total_contratos": contratos.count(),
        "total_medicoes": medicoes.count(),
    }


def _montar_evolucao_mensal(medicoes):
    agrupado = defaultdict(Decimal)

    for medicao in medicoes:
        mes_ano = _texto(getattr(medicao, "mes_ano", ""), "Sem mês")
        agrupado[mes_ano] += _valor_medicao(medicao, "valor_medido")

    return sorted(agrupado.items(), key=lambda item: item[0])


def _montar_status_contratos(contratos):
    agrupado = defaultdict(int)

    for contrato in contratos:
        agrupado[_texto(getattr(contrato, "status", ""), "Sem status")] += 1

    return sorted(agrupado.items(), key=lambda item: item[0])


def _montar_situacao_medicoes(medicoes):
    agrupado = defaultdict(int)

    for medicao in medicoes:
        agrupado[_texto(getattr(medicao, "situacao", ""), "Sem situação")] += 1

    return sorted(agrupado.items(), key=lambda item: item[0])


def _montar_ranking(contratos, medicoes):
    medido_por_contrato = defaultdict(Decimal)

    for medicao in medicoes:
        numero = _texto(getattr(medicao, "numero_contrato", ""), "")
        medido_por_contrato[numero] += _valor_medicao(medicao, "valor_medido")

    ranking = []

    for contrato in contratos:
        numero = _texto(getattr(contrato, "numero_contrato", ""), "")
        valor_contratado = _valor_contrato(contrato)
        valor_medido = medido_por_contrato.get(numero, Decimal("0"))
        percentual = Decimal("0")

        if valor_contratado:
            percentual = (valor_medido / valor_contratado) * Decimal("100")

        ranking.append(
            {
                "numero": numero,
                "empresa": _texto(getattr(contrato, "empresa", ""), "-"),
                "valor_contratado": valor_contratado,
                "valor_medido": valor_medido,
                "percentual": percentual,
            }
        )

    return sorted(ranking, key=lambda item: item["percentual"], reverse=True)


@login_required
def exportar_dashboard_pdf(request):
    dados_filtrados = _aplicar_filtros(request)

    contratos = dados_filtrados["contratos"]
    medicoes = dados_filtrados["medicoes"]
    filtros = dados_filtrados["filtros"]

    resumo = _montar_resumo(contratos, medicoes)
    evolucao_mensal = _montar_evolucao_mensal(medicoes)
    status_contratos = _montar_status_contratos(contratos)
    situacao_medicoes = _montar_situacao_medicoes(medicoes)
    ranking = _montar_ranking(contratos, medicoes)

    buffer = BytesIO()

    documento = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.4 * cm,
        leftMargin=1.4 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.2 * cm,
        title="Relatório MSM Industrial",
        author="MSM Industrial",
    )

    estilos = _montar_estilos()
    elementos = []

    agora = timezone.localtime().strftime("%d/%m/%Y às %H:%M")

    elementos.append(_p("MSM Industrial", estilos["titulo"]))
    elementos.append(
        _p(
            f"Relatório de medições e contratos gerado em {agora}.",
            estilos["subtitulo"],
        )
    )

    filtros_tabela = [
        [
            "Contrato",
            "Status",
            "Situação",
        ],
        [
            _formatar_filtro(filtros["contrato"]),
            _formatar_filtro(filtros["status"]),
            _formatar_filtro(filtros["situacao"]),
        ],
    ]

    elementos.append(_p("Filtros aplicados", estilos["secao"]))
    elementos.append(
        _tabela(
            filtros_tabela,
            larguras=[6 * cm, 6 * cm, 6 * cm],
            repetir_cabecalho=True,
        )
    )
    elementos.append(Spacer(1, 0.35 * cm))

    cards_linha_1 = [
        _card("Total contratado", _formatar_moeda(resumo["total_contratado"]), estilos),
        _card("Total medido", _formatar_moeda(resumo["total_medido"]), estilos),
        _card("Total pago", _formatar_moeda(resumo["total_pago"]), estilos),
    ]

    cards_linha_2 = [
        _card("Total faturado", _formatar_moeda(resumo["total_faturado"]), estilos),
        _card("A processar", _formatar_moeda(resumo["total_a_processar"]), estilos),
        _card("Saldo estimado", _formatar_moeda(resumo["saldo_estimado"]), estilos),
    ]

    cards_linha_3 = [
        _card("Contratos", str(resumo["total_contratos"]), estilos),
        _card("Medições", str(resumo["total_medicoes"]), estilos),
        _card("Evolução", _formatar_percentual(resumo["percentual_evolucao"]), estilos),
    ]

    elementos.append(_p("Resumo financeiro", estilos["secao"]))
    elementos.append(Table([cards_linha_1], colWidths=[5.7 * cm, 5.7 * cm, 5.7 * cm]))
    elementos.append(Spacer(1, 0.2 * cm))
    elementos.append(Table([cards_linha_2], colWidths=[5.7 * cm, 5.7 * cm, 5.7 * cm]))
    elementos.append(Spacer(1, 0.2 * cm))
    elementos.append(Table([cards_linha_3], colWidths=[5.7 * cm, 5.7 * cm, 5.7 * cm]))
    elementos.append(Spacer(1, 0.35 * cm))

    elementos.append(_p("Contratos por status", estilos["secao"]))

    if status_contratos:
        dados_status = [["Status", "Quantidade"]]

        for status, total in status_contratos:
            dados_status.append([status, str(total)])

        elementos.append(_tabela(dados_status, larguras=[12 * cm, 5.2 * cm]))
    else:
        elementos.append(_p("Nenhum contrato encontrado.", estilos["normal_cinza"]))

    elementos.append(Spacer(1, 0.25 * cm))
    elementos.append(_p("Medições por situação", estilos["secao"]))

    if situacao_medicoes:
        dados_situacao = [["Situação", "Quantidade"]]

        for situacao, total in situacao_medicoes:
            dados_situacao.append([situacao, str(total)])

        elementos.append(_tabela(dados_situacao, larguras=[12 * cm, 5.2 * cm]))
    else:
        elementos.append(_p("Nenhuma medição encontrada.", estilos["normal_cinza"]))

    elementos.append(Spacer(1, 0.25 * cm))
    elementos.append(_p("Ranking de evolução por contrato", estilos["secao"]))

    if ranking:
        dados_ranking = [
            [
                "Contrato",
                "Empresa",
                "Contratado",
                "Medido",
                "Evolução",
            ]
        ]

        for item in ranking[:12]:
            dados_ranking.append(
                [
                    item["numero"],
                    _p(item["empresa"], estilos["normal"]),
                    _formatar_moeda(item["valor_contratado"]),
                    _formatar_moeda(item["valor_medido"]),
                    _formatar_percentual(item["percentual"]),
                ]
            )

        elementos.append(
            _tabela(
                dados_ranking,
                larguras=[2.6 * cm, 5.5 * cm, 3.1 * cm, 3.1 * cm, 2.9 * cm],
            )
        )
    else:
        elementos.append(_p("Nenhum contrato encontrado.", estilos["normal_cinza"]))

    elementos.append(Spacer(1, 0.25 * cm))
    elementos.append(_p("Evolução mensal", estilos["secao"]))

    if evolucao_mensal:
        dados_evolucao = [["Mês/Ano", "Valor medido"]]

        for mes_ano, valor in evolucao_mensal[:24]:
            dados_evolucao.append([mes_ano, _formatar_moeda(valor)])

        elementos.append(_tabela(dados_evolucao, larguras=[6 * cm, 11.2 * cm]))
    else:
        elementos.append(_p("Nenhuma evolução mensal encontrada.", estilos["normal_cinza"]))

    elementos.append(Spacer(1, 0.25 * cm))
    elementos.append(_p("Observação", estilos["secao"]))
    elementos.append(
        _p(
            "Este relatório é gerado automaticamente a partir dos dados sincronizados da planilha oficial.",
            estilos["normal_cinza"],
        )
    )

    documento.build(
        elementos,
        onFirstPage=_cabecalho_rodape,
        onLaterPages=_cabecalho_rodape,
    )

    buffer.seek(0)

    nome_arquivo = "relatorio_msm_industrial.pdf"

    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{nome_arquivo}"'

    return response