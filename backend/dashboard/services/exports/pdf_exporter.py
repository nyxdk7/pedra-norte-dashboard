from decimal import Decimal, InvalidOperation
from io import BytesIO
from xml.sax.saxutils import escape

from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def converter_decimal(valor):
    if valor is None or valor == "":
        return Decimal("0")

    try:
        return Decimal(str(valor))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal("0")


def formatar_numero_brasileiro(valor, casas=2):
    numero = converter_decimal(valor)

    sinal = "-" if numero < 0 else ""
    numero = abs(numero)

    texto = f"{numero:,.{casas}f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")

    return f"{sinal}{texto}"


def formatar_moeda(valor):
    return f"R$ {formatar_numero_brasileiro(valor, 2)}"


def formatar_percentual(valor):
    return f"{formatar_numero_brasileiro(valor, 2)}%"


def texto(valor):
    if valor is None or valor == "":
        return "Não informado"

    return escape(str(valor))


def paragrafo(valor, estilo):
    return Paragraph(texto(valor), estilo)


def cabecalho_rodape(canvas, doc):
    canvas.saveState()

    largura, altura = landscape(A4)

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#666666"))

    canvas.drawString(
        doc.leftMargin,
        1.0 * cm,
        "Pedra Norte - Dashboard interno",
    )

    canvas.drawRightString(
        largura - doc.rightMargin,
        1.0 * cm,
        f"Página {doc.page}",
    )

    canvas.restoreState()


def criar_tabela_dados(dados, largura_total, estilos):
    linhas = []

    for linha in dados:
        linhas.append([
            Paragraph(f"<b>{texto(linha[0])}</b><br/>{texto(linha[1])}", estilos["box"]),
            Paragraph(f"<b>{texto(linha[2])}</b><br/>{texto(linha[3])}", estilos["box"]),
        ])

    tabela = Table(
        linhas,
        colWidths=[
            largura_total / 2,
            largura_total / 2,
        ],
    )

    tabela.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#DDDDDD")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    return tabela


def exportar_contrato_pdf(
    contrato,
    medicoes,
    total_medicoes,
    total_medido,
    total_pago,
    total_liquidado,
    total_faturado,
    total_a_processar,
    saldo_restante,
    percentual_medido,
):
    arquivo = BytesIO()

    doc = SimpleDocTemplate(
        arquivo,
        pagesize=landscape(A4),
        rightMargin=1.3 * cm,
        leftMargin=1.3 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.5 * cm,
        title=f"Contrato {contrato.numero_contrato}",
        author="Pedra Norte",
    )

    largura_total = landscape(A4)[0] - doc.leftMargin - doc.rightMargin

    styles = getSampleStyleSheet()

    estilos = {
        "titulo": ParagraphStyle(
            "TituloCustom",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#111827"),
            spaceAfter=8,
        ),
        "subtitulo": ParagraphStyle(
            "SubtituloCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#555555"),
            spaceAfter=12,
        ),
        "secao": ParagraphStyle(
            "SecaoCustom",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#111827"),
            spaceBefore=12,
            spaceAfter=8,
        ),
        "normal": ParagraphStyle(
            "NormalCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#222222"),
        ),
        "box": ParagraphStyle(
            "BoxCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#222222"),
        ),
        "tabela": ParagraphStyle(
            "TabelaCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.4,
            leading=9,
            textColor=colors.HexColor("#222222"),
        ),
        "cabecalho_tabela": ParagraphStyle(
            "CabecalhoTabelaCustom",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            alignment=TA_CENTER,
            textColor=colors.white,
        ),
    }

    agora = timezone.localtime(timezone.now()).strftime("%d/%m/%Y às %H:%M:%S")

    elementos = []

    elementos.append(
        Paragraph(
            f"Relatório do Contrato {texto(contrato.numero_contrato)}",
            estilos["titulo"],
        )
    )

    elementos.append(
        Paragraph(
            f"Pedra Norte - Relatório gerado em {agora}",
            estilos["subtitulo"],
        )
    )

    elementos.append(Paragraph("Resumo executivo", estilos["secao"]))

    dados_resumo = [
        [
            "Valor contratual",
            formatar_moeda(contrato.valor_contratual),
            "Valor total",
            formatar_moeda(contrato.valor_total),
        ],
        [
            "Total medido",
            formatar_moeda(total_medido),
            "Saldo restante",
            formatar_moeda(saldo_restante),
        ],
        [
            "Total pago",
            formatar_moeda(total_pago),
            "Total liquidado",
            formatar_moeda(total_liquidado),
        ],
        [
            "Total faturado",
            formatar_moeda(total_faturado),
            "A processar",
            formatar_moeda(total_a_processar),
        ],
        [
            "% medido sobre total",
            formatar_percentual(percentual_medido),
            "Total de medições",
            str(total_medicoes),
        ],
    ]

    elementos.append(criar_tabela_dados(dados_resumo, largura_total, estilos))

    elementos.append(Spacer(1, 10))
    elementos.append(Paragraph("Dados do contrato", estilos["secao"]))

    dados_contrato = [
        [
            "Nº Contrato",
            contrato.numero_contrato,
            "Empresa",
            contrato.empresa,
        ],
        [
            "Status",
            contrato.status,
            "% Executado na planilha",
            formatar_percentual(contrato.percentual_executado),
        ],
        [
            "Data início",
            contrato.data_inicio,
            "Data fim",
            contrato.data_fim,
        ],
        [
            "Garantia",
            contrato.garantia,
            "Objeto",
            contrato.objeto,
        ],
    ]

    elementos.append(criar_tabela_dados(dados_contrato, largura_total, estilos))

    elementos.append(Spacer(1, 10))
    elementos.append(Paragraph("Medições do contrato", estilos["secao"]))

    cabecalho = [
        Paragraph("Nº Medição", estilos["cabecalho_tabela"]),
        Paragraph("Mês/Ano", estilos["cabecalho_tabela"]),
        Paragraph("Valor Medido", estilos["cabecalho_tabela"]),
        Paragraph("Valor Pago", estilos["cabecalho_tabela"]),
        Paragraph("Data Pagamento", estilos["cabecalho_tabela"]),
        Paragraph("Liquidado", estilos["cabecalho_tabela"]),
        Paragraph("Faturado", estilos["cabecalho_tabela"]),
        Paragraph("Data Faturamento", estilos["cabecalho_tabela"]),
        Paragraph("A Processar", estilos["cabecalho_tabela"]),
        Paragraph("Situação", estilos["cabecalho_tabela"]),
    ]

    linhas_medicoes = [cabecalho]

    for medicao in medicoes:
        linhas_medicoes.append(
            [
                paragrafo(medicao.numero_medicao, estilos["tabela"]),
                paragrafo(medicao.mes_ano, estilos["tabela"]),
                paragrafo(formatar_moeda(medicao.valor_medido), estilos["tabela"]),
                paragrafo(formatar_moeda(medicao.valor_pago), estilos["tabela"]),
                paragrafo(medicao.data_pagamento, estilos["tabela"]),
                paragrafo(formatar_moeda(medicao.valor_liquidado), estilos["tabela"]),
                paragrafo(formatar_moeda(medicao.valor_faturado), estilos["tabela"]),
                paragrafo(medicao.data_faturamento, estilos["tabela"]),
                paragrafo(formatar_moeda(medicao.valor_a_processar), estilos["tabela"]),
                paragrafo(medicao.situacao, estilos["tabela"]),
            ]
        )

    if len(linhas_medicoes) == 1:
        linhas_medicoes.append(
            [
                Paragraph("Nenhuma medição encontrada.", estilos["tabela"]),
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
            ]
        )

    tabela_medicoes = Table(
        linhas_medicoes,
        repeatRows=1,
        colWidths=[
            2.0 * cm,
            1.8 * cm,
            2.5 * cm,
            2.5 * cm,
            2.3 * cm,
            2.5 * cm,
            2.5 * cm,
            2.4 * cm,
            2.5 * cm,
            2.1 * cm,
        ],
    )

    tabela_medicoes.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f343a")),
                ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#DDDDDD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )

    elementos.append(tabela_medicoes)

    doc.build(
        elementos,
        onFirstPage=cabecalho_rodape,
        onLaterPages=cabecalho_rodape,
    )

    arquivo.seek(0)

    return arquivo