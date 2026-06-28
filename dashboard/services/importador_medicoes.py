from decimal import Decimal, InvalidOperation

from dashboard.models import Medicao
from dashboard.services.google_sheets import read_sheet_range


SPREADSHEET_ID = "1UDfxZbHEtbiIzB7HpxGg-nLSN1aJRrafi7blwiLjVMU"


def converter_valor_brasileiro(valor):
    if not valor:
        return Decimal("0")

    valor = str(valor).strip()

    if valor in ["-", "-   ", " - ", ""]:
        return Decimal("0")

    valor = valor.replace("R$", "")
    valor = valor.replace(" ", "")
    valor = valor.replace(".", "")
    valor = valor.replace(",", ".")

    try:
        return Decimal(valor)
    except InvalidOperation:
        return Decimal("0")


def pegar_coluna(linha, indice):
    if len(linha) > indice and linha[indice]:
        return str(linha[indice]).strip()

    return ""


def importar_medicoes():
    dados = read_sheet_range(
        spreadsheet_id=SPREADSHEET_ID,
        range_name="'Medições'!A1:K500",
    )

    if not dados or len(dados) <= 1:
        return {
            "sucesso": False,
            "mensagem": "Nenhuma medição encontrada na planilha.",
            "total_importado": 0,
        }

    linhas = dados[1:]

    Medicao.objects.all().delete()

    total_importado = 0

    for linha in linhas:
        numero_medicao = pegar_coluna(linha, 0)
        numero_contrato = pegar_coluna(linha, 1)
        mes_ano = pegar_coluna(linha, 2)

        valor_medido = pegar_coluna(linha, 3)
        valor_pago = pegar_coluna(linha, 4)
        data_pagamento = pegar_coluna(linha, 5)

        valor_liquidado = pegar_coluna(linha, 6)
        valor_faturado = pegar_coluna(linha, 7)
        data_faturamento = pegar_coluna(linha, 8)

        valor_a_processar = pegar_coluna(linha, 9)
        situacao = pegar_coluna(linha, 10)

        if not numero_medicao and not numero_contrato:
            continue

        Medicao.objects.create(
            numero_medicao=numero_medicao,
            numero_contrato=numero_contrato,
            mes_ano=mes_ano,
            valor_medido=converter_valor_brasileiro(valor_medido),
            valor_pago=converter_valor_brasileiro(valor_pago),
            data_pagamento=data_pagamento,
            valor_liquidado=converter_valor_brasileiro(valor_liquidado),
            valor_faturado=converter_valor_brasileiro(valor_faturado),
            data_faturamento=data_faturamento,
            valor_a_processar=converter_valor_brasileiro(valor_a_processar),
            situacao=situacao,
        )

        total_importado += 1

    return {
        "sucesso": True,
        "mensagem": "Medições importadas com sucesso.",
        "total_importado": total_importado,
    }
