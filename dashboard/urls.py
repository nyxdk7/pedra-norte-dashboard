from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path

from . import views


urlpatterns = [
    path(
        "login/",
        LoginView.as_view(template_name="dashboard/login.html"),
        name="login",
    ),

    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    path(
        "",
        views.home,
        name="home",
    ),

    path(
        "teste-sheets/",
        views.teste_sheets,
        name="teste_sheets",
    ),

    path(
        "sincronizar/",
        views.sincronizar_geral,
        name="sincronizar_geral",
    ),

    path(
        "api/sincronizar/",
        views.sincronizar_geral_api,
        name="sincronizar_geral_api",
    ),

    path(
        "historico-sincronizacoes/",
        views.historico_sincronizacoes,
        name="historico_sincronizacoes",
    ),

    path(
        "contratos/",
        views.contratos,
        name="contratos",
    ),

    path(
        "contratos/<path:numero_contrato>/pdf/",
        views.exportar_contrato_pdf_view,
        name="exportar_contrato_pdf",
    ),

    path(
        "contratos/<path:numero_contrato>/",
        views.contrato_detalhe,
        name="contrato_detalhe",
    ),

    path(
        "sincronizar-contratos/",
        views.sincronizar_contratos,
        name="sincronizar_contratos",
    ),

    path(
        "medicoes/",
        views.medicoes,
        name="medicoes",
    ),

    path(
        "sincronizar-medicoes/",
        views.sincronizar_medicoes,
        name="sincronizar_medicoes",
    ),

    path(
        "exportar/contratos/excel/",
        views.exportar_contratos_excel_view,
        name="exportar_contratos_excel",
    ),

    path(
        "exportar/medicoes/excel/",
        views.exportar_medicoes_excel_view,
        name="exportar_medicoes_excel",
    ),
]