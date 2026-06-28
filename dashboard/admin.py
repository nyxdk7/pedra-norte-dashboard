from django.contrib import admin

from .models import Contrato, Medicao


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):
    list_display = (
        "numero_contrato",
        "empresa",
        "valor_total",
        "status",
        "percentual_executado",
        "atualizado_em",
    )
    search_fields = ("numero_contrato", "empresa", "objeto", "status")
    list_filter = ("status", "empresa")


@admin.register(Medicao)
class MedicaoAdmin(admin.ModelAdmin):
    list_display = (
        "numero_medicao",
        "numero_contrato",
        "mes_ano",
        "valor_medido",
        "valor_pago",
        "situacao",
        "atualizado_em",
    )
    search_fields = ("numero_medicao", "numero_contrato", "mes_ano", "situacao")
    list_filter = ("situacao", "numero_contrato")
