from rest_framework import serializers


def valor_seguro(obj, campo, padrao=None):
    return getattr(obj, campo, padrao)


def texto_seguro(valor):
    if valor is None:
        return ""

    return str(valor)


def decimal_seguro(valor):
    if valor is None:
        return "0.00"

    return str(valor)


def data_segura(valor):
    if valor is None:
        return None

    if hasattr(valor, "isoformat"):
        return valor.isoformat()

    return str(valor)


def numero_contrato_seguro(valor):
    if valor is None:
        return ""

    if hasattr(valor, "numero_contrato"):
        return str(valor.numero_contrato)

    return str(valor)


def usuario_seguro(valor):
    if valor is None:
        return ""

    if hasattr(valor, "get_full_name"):
        nome_completo = valor.get_full_name()
        if nome_completo:
            return nome_completo

    if hasattr(valor, "username"):
        return valor.username

    return str(valor)


class ContratoSerializer(serializers.Serializer):
    def to_representation(self, obj):
        return {
            "numero_contrato": texto_seguro(valor_seguro(obj, "numero_contrato")),
            "empresa": texto_seguro(valor_seguro(obj, "empresa")),
            "objeto": texto_seguro(valor_seguro(obj, "objeto")),
            "status": texto_seguro(valor_seguro(obj, "status")),
            "data_inicio": data_segura(valor_seguro(obj, "data_inicio")),
            "data_fim": data_segura(valor_seguro(obj, "data_fim")),
            "garantia": texto_seguro(valor_seguro(obj, "garantia")),
            "valor_contratual": decimal_seguro(valor_seguro(obj, "valor_contratual")),
            "valor_total": decimal_seguro(valor_seguro(obj, "valor_total")),
            "percentual_executado": decimal_seguro(valor_seguro(obj, "percentual_executado")),
        }


class MedicaoSerializer(serializers.Serializer):
    def to_representation(self, obj):
        return {
            "numero_medicao": texto_seguro(valor_seguro(obj, "numero_medicao")),
            "numero_contrato": numero_contrato_seguro(valor_seguro(obj, "numero_contrato")),
            "mes_ano": texto_seguro(valor_seguro(obj, "mes_ano")),
            "valor_medido": decimal_seguro(valor_seguro(obj, "valor_medido")),
            "valor_pago": decimal_seguro(valor_seguro(obj, "valor_pago")),
            "data_pagamento": data_segura(valor_seguro(obj, "data_pagamento")),
            "valor_liquidado": decimal_seguro(valor_seguro(obj, "valor_liquidado")),
            "valor_faturado": decimal_seguro(valor_seguro(obj, "valor_faturado")),
            "data_faturamento": data_segura(valor_seguro(obj, "data_faturamento")),
            "valor_a_processar": decimal_seguro(valor_seguro(obj, "valor_a_processar")),
            "situacao": texto_seguro(valor_seguro(obj, "situacao")),
        }


class SincronizacaoHistoricoSerializer(serializers.Serializer):
    def to_representation(self, obj):
        return {
            "usuario": usuario_seguro(valor_seguro(obj, "usuario")),
            "origem": texto_seguro(valor_seguro(obj, "origem")),
            "status": texto_seguro(valor_seguro(obj, "status")),
            "total_contratos": valor_seguro(obj, "total_contratos", 0),
            "total_medicoes": valor_seguro(obj, "total_medicoes", 0),
            "mensagem": texto_seguro(valor_seguro(obj, "mensagem")),
            "data_hora": data_segura(valor_seguro(obj, "data_hora")),
        }