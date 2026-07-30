from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from dashboard.models import Medicao


class MedicoesApiTests(TestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(
            username="teste-medicoes",
            password="senha-forte-123",
        )
        self.client.force_login(self.usuario)

        self.criar_medicao(
            numero="01",
            mes_ano="dez/25",
            situacao="Supervisão",
            medido="1000.00",
            liquidado="0.00",
            pago="0.00",
        )
        self.criar_medicao(
            numero="02",
            mes_ano="jan/26",
            situacao="Fiscalização",
            medido="2000.00",
            liquidado="0.00",
            pago="0.00",
        )
        self.criar_medicao(
            numero="03",
            mes_ano="mar/26",
            situacao="Faturado",
            medido="3000.00",
            liquidado="0.00",
            pago="0.00",
        )
        self.criar_medicao(
            numero="04",
            mes_ano="abr/26",
            situacao="Pago",
            medido="4000.00",
            liquidado="4000.00",
            pago="4000.00",
        )

    def criar_medicao(
        self,
        numero,
        mes_ano,
        situacao,
        medido,
        liquidado,
        pago,
    ):
        return Medicao.objects.create(
            numero_medicao=numero,
            numero_contrato="CT-001",
            mes_ano=mes_ano,
            valor_medido=Decimal(medido),
            valor_liquidado=Decimal(liquidado),
            valor_pago=Decimal(pago),
            valor_faturado=Decimal(medido),
            valor_a_processar=Decimal("0.00"),
            situacao=situacao,
        )

    def test_visao_padrao_mostra_pendentes_em_ordem_recente(self):
        resposta = self.client.get(reverse("api_medicoes"))

        self.assertEqual(resposta.status_code, 200)

        dados = resposta.json()

        self.assertEqual(dados["filtros"]["visao"], "pendentes")
        self.assertEqual(dados["meta"]["total_pendentes"], 3)
        self.assertEqual(dados["meta"]["total_pagas"], 1)
        self.assertEqual(dados["meta"]["pagas_ocultas"], 1)

        numeros = [
            item["numero_medicao"]
            for item in dados["results"]
        ]

        self.assertEqual(numeros, ["03", "02", "01"])

    def test_visao_pagas_mostra_apenas_medicoes_pagas(self):
        resposta = self.client.get(
            reverse("api_medicoes"),
            {"visao": "pagas"},
        )

        self.assertEqual(resposta.status_code, 200)

        dados = resposta.json()

        self.assertEqual(dados["meta"]["total_disponivel"], 1)
        self.assertEqual(
            dados["results"][0]["numero_medicao"],
            "04",
        )
        self.assertEqual(
            dados["results"][0]["situacao"],
            "Pago",
        )

    def test_filtro_situacao_ignora_acentos(self):
        resposta = self.client.get(
            reverse("api_medicoes"),
            {
                "visao": "historico",
                "situacao": "Fiscalizacao",
            },
        )

        self.assertEqual(resposta.status_code, 200)

        dados = resposta.json()

        self.assertEqual(len(dados["results"]), 1)
        self.assertEqual(
            dados["results"][0]["situacao"],
            "Fiscalização",
        )

    def test_resposta_traz_grupos_e_opcoes_de_filtro(self):
        resposta = self.client.get(reverse("api_medicoes"))
        dados = resposta.json()

        situacoes_grupos = [
            item["situacao"]
            for item in dados["grupos_situacao"]
        ]

        self.assertIn("Supervisão", situacoes_grupos)
        self.assertIn("Fiscalização", situacoes_grupos)
        self.assertIn("Faturado", situacoes_grupos)
        self.assertIn("abr/26", dados["opcoes"]["meses"])
        self.assertEqual(
            dados["opcoes"]["visoes"][0]["value"],
            "pendentes",
        )
