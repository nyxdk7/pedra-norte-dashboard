from django.conf import settings
from django.db import models


class PerfilUsuarioSistema(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_sistema",
    )
    deve_trocar_senha = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil do usuário do sistema"
        verbose_name_plural = "Perfis dos usuários do sistema"

    def __str__(self):
        return f"{self.usuario.username} - trocar senha: {self.deve_trocar_senha}"


class ConfiguracaoSistema(models.Model):
    CHART_PALETTE_CHOICES = [
        ("msm-industrial", "MSM Industrial"),
        ("azul-corporativo", "Azul corporativo"),
        ("verde-engenharia", "Verde engenharia"),
        ("cinza-tecnico", "Cinza técnico"),
        ("alto-contraste", "Alto contraste"),
    ]

    chave = models.CharField(max_length=80, unique=True)
    paleta_graficos = models.CharField(
        max_length=40,
        choices=CHART_PALETTE_CHOICES,
        default="msm-industrial",
    )
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuração do sistema"
        verbose_name_plural = "Configurações do sistema"

    def __str__(self):
        return f"{self.chave} - {self.paleta_graficos}"

    @classmethod
    def obter_configuracao_global(cls):
        configuracao, _ = cls.objects.get_or_create(
            chave="global",
            defaults={
                "paleta_graficos": "msm-industrial",
            },
        )

        return configuracao