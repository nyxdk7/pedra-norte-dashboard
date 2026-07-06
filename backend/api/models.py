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