from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Cria os grupos de permissões do Dashboard Pedra Norte."

    def handle(self, *args, **options):
        grupos = [
            "Administrador",
            "Diretoria",
            "Financeiro",
            "Engenharia",
            "Somente leitura",
        ]

        for nome_grupo in grupos:
            grupo, criado = Group.objects.get_or_create(name=nome_grupo)

            if criado:
                self.stdout.write(
                    self.style.SUCCESS(f"Grupo criado: {nome_grupo}")
                )
            else:
                self.stdout.write(f"Grupo já existia: {nome_grupo}")

        User = get_user_model()
        superusuarios = User.objects.filter(is_superuser=True)

        grupo_admin = Group.objects.get(name="Administrador")

        for usuario in superusuarios:
            usuario.groups.add(grupo_admin)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Superusuário adicionado ao grupo Administrador: {usuario.username}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS("Permissões configuradas com sucesso.")
        )