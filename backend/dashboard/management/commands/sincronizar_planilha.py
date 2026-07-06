from django.core.management.base import BaseCommand
from django.utils import timezone

from dashboard.services.importador_geral import sincronizar_tudo


class Command(BaseCommand):
    help = "Sincroniza contratos e medições da planilha Google Sheets."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando sincronização da planilha...")

        resultado = sincronizar_tudo(
            usuario=None,
            origem="automatica_servidor",
        )

        agora = timezone.localtime(timezone.now()).strftime("%d/%m/%Y %H:%M:%S")

        if resultado["sucesso"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[{agora}] Sincronização concluída: "
                    f"{resultado['total_contratos']} contratos e "
                    f"{resultado['total_medicoes']} medições."
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"[{agora}] Falha na sincronização: "
                    f"{resultado.get('mensagem', 'Erro desconhecido')}"
                )
            )