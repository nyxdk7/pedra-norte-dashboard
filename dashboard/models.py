from django.contrib.auth.models import User
from django.db import models


class Contrato(models.Model):
    numero_contrato = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Nº Contrato",
    )

    empresa = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Empresa",
    )

    objeto = models.TextField(
        blank=True,
        verbose_name="Objeto",
    )

    valor_contratual = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor Contratual",
    )

    total_aditivos = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Total de Aditivos",
    )

    total_reajustamento = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Total de Reajustamento",
    )

    reequilibrio = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Reequilíbrio",
    )

    valor_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor Total",
    )

    garantia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Garantia",
    )

    data_inicio = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Data Início",
    )

    data_fim = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Data Fim",
    )

    status = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Status",
    )

    percentual_executado = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        verbose_name="% Executado",
    )

    valor_msm_a_executar = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor MSM a Executar",
    )

    valor_csm_a_executar = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor CSM a Executar",
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Criado em",
    )

    atualizado_em = models.DateTimeField(
        auto_now=True,
        verbose_name="Atualizado em",
    )

    class Meta:
        verbose_name = "Contrato"
        verbose_name_plural = "Contratos"
        ordering = ["numero_contrato"]

    def __str__(self):
        return self.numero_contrato


class Medicao(models.Model):
    numero_medicao = models.CharField(
        max_length=50,
        verbose_name="Nº Medição",
    )

    numero_contrato = models.CharField(
        max_length=50,
        verbose_name="Nº Contrato",
    )

    mes_ano = models.CharField(
        max_length=20,
        verbose_name="Mês/Ano",
        blank=True,
    )

    valor_medido = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor Medido",
    )

    valor_pago = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor Pago",
    )

    data_pagamento = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Data Pagamento",
    )

    valor_liquidado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor Liquidado",
    )

    valor_faturado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Valor Faturado",
    )

    data_faturamento = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Data Faturamento",
    )

    valor_a_processar = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name="Medições a Processar",
    )

    situacao = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Situação",
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Criado em",
    )

    atualizado_em = models.DateTimeField(
        auto_now=True,
        verbose_name="Atualizado em",
    )

    class Meta:
        verbose_name = "Medição"
        verbose_name_plural = "Medições"
        ordering = ["numero_contrato", "numero_medicao"]

    def __str__(self):
        return f"{self.numero_medicao} - {self.numero_contrato}"


class SincronizacaoHistorico(models.Model):
    STATUS_CHOICES = [
        ("sucesso", "Sucesso"),
        ("erro", "Erro"),
    ]

    ORIGEM_CHOICES = [
        ("manual", "Manual"),
        ("automatica_navegador", "Automática pelo navegador"),
        ("automatica_servidor", "Automática pelo servidor"),
    ]

    data_hora = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data/hora",
    )

    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Usuário",
    )

    origem = models.CharField(
        max_length=50,
        choices=ORIGEM_CHOICES,
        default="manual",
        verbose_name="Origem",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="sucesso",
        verbose_name="Status",
    )

    total_contratos = models.IntegerField(
        default=0,
        verbose_name="Total de contratos",
    )

    total_medicoes = models.IntegerField(
        default=0,
        verbose_name="Total de medições",
    )

    mensagem = models.TextField(
        blank=True,
        verbose_name="Mensagem",
    )

    class Meta:
        verbose_name = "Histórico de sincronização"
        verbose_name_plural = "Histórico de sincronizações"
        ordering = ["-data_hora"]

    def __str__(self):
        return f"{self.data_hora} - {self.status}"