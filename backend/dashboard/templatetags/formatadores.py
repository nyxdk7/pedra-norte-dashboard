from decimal import Decimal, InvalidOperation

from django import template


register = template.Library()


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


@register.filter
def brl(valor):
    return f"R$ {formatar_numero_brasileiro(valor, 2)}"


@register.filter
def numero_br(valor):
    return formatar_numero_brasileiro(valor, 2)


@register.filter
def percentual_br(valor):
    return f"{formatar_numero_brasileiro(valor, 2)}%"


@register.filter
def subtrair(valor, outro_valor):
    return converter_decimal(valor) - converter_decimal(outro_valor)


@register.filter
def numero_js(valor):
    numero = converter_decimal(valor)
    return str(numero).replace(",", ".")