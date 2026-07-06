from decimal import Decimal, InvalidOperation

from dashboard.models import Contrato
from dashboard.services.google_sheets import read_sheet_range


SPREADSHEET_ID = "1UDfxZbHEtbiIzB7HpxGg-nLSN1aJRrafi7blwiLjVMU"


def converter_valor_brasileiro(valor):
    if not valor:
        return Decimal("0")

    valor = str(valor).strip()

    if valor in ["-", "-   ", " - ", ""]:
        return Decimal("0")

    valor = valor.replace("R$", "")
    valor = valor.replace("%", "")
    valor = valor.replace(" ", "")
    valor = valor.replace(".", "")
    valor = valor.replace(",", ".")

    try:
        return Decimal(valor)
    except InvalidOperation:
        return Decimal("0")


def converter_percentual(valor):
    if not valor:
        return Decimal("0")

    valor = str(valor).strip()

    if valor in ["-", "-   ", " - ", ""]:
        return Decimal("0")

    tem_porcentagem = "%" in valor

    valor = valor.replace("%", "")
    valor = valor.replace(" ", "")
    valor = valor.replace(".", "")
    valor = valor.replace(",", ".")

    try:
        numero = Decimal(valor)
    except InvalidOperation:
        return Decimal("0")

    if not tem_porcentagem and numero <= 1:
        numero = numero * 100

    return numero


def pegar_coluna(linha, indice):
    if len(linha) > indice and linha[indice]:
        return str(linha[indice]).strip()

    return ""


def importar_contratos():
    dados = read_sheet_range(
        spreadsheet_id=SPREADSHEET_ID,
        range_name="'Contratos'!A1:O500",
    )

    if not dados or len(dados) <= 1:
        return {
            "sucesso": False,
            "mensagem": "Nenhum contrato encontrado na planilha.",
            "total_importado": 0,
        }

    linhas = dados[1:]

    Contrato.objects.all().delete()

    total_importado = 0

    for linha in linhas:
        numero_contrato = pegar_coluna(linha, 0)

        if not numero_contrato:
            continue

        objeto = pegar_coluna(linha, 1)
        empresa = pegar_coluna(linha, 2)

        valor_contratual = pegar_coluna(linha, 3)
        total_aditivos = pegar_coluna(linha, 4)
        total_reajustamento = pegar_coluna(linha, 5)
        reequilibrio = pegar_coluna(linha, 6)
        valor_total = pegar_coluna(linha, 7)
        garantia = pegar_coluna(linha, 8)

        data_inicio = pegar_coluna(linha, 9)
        data_fim = pegar_coluna(linha, 10)
        status = pegar_coluna(linha, 11)

        percentual_executado = pegar_coluna(linha, 12)
        valor_msm_a_executar = pegar_coluna(linha, 13)
        valor_csm_a_executar = pegar_coluna(linha, 14)

        Contrato.objects.create(
            numero_contrato=numero_contrato,
            objeto=objeto,
            empresa=empresa,
            valor_contratual=converter_valor_brasileiro(valor_contratual),
            total_aditivos=converter_valor_brasileiro(total_aditivos),
            total_reajustamento=converter_valor_brasileiro(total_reajustamento),
            reequilibrio=converter_valor_brasileiro(reequilibrio),
            valor_total=converter_valor_brasileiro(valor_total),
            garantia=garantia,
            data_inicio=data_inicio,
            data_fim=data_fim,
            status=status,
            percentual_executado=converter_percentual(percentual_executado),
            valor_msm_a_executar=converter_valor_brasileiro(valor_msm_a_executar),
            valor_csm_a_executar=converter_valor_brasileiro(valor_csm_a_executar),
        )

        total_importado += 1

    return {
        "sucesso": True,
        "mensagem": "Contratos importados com sucesso.",
        "total_importado": total_importado,
    }
