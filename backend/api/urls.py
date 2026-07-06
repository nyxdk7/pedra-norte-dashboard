from django.urls import path

from api import views
from api.pdf_reports import exportar_dashboard_pdf
from dashboard.views import exportar_contrato_pdf_view

urlpatterns = [
    path("auth/login/", views.login_api, name="api_login"),
    path("auth/logout/", views.logout_api, name="api_logout"),
    path("auth/me/", views.me_api, name="api_me"),

    path("dashboard/", views.dashboard_api, name="api_dashboard"),

    path("contratos/", views.contratos_api, name="api_contratos"),

    path(
        "contratos/<path:numero_contrato>/pdf/",
        exportar_contrato_pdf_view,
        name="api_contrato_pdf",
    ),

    path(
        "contratos/<path:numero_contrato>/",
        views.contrato_detalhe_api,
        name="api_contrato_detalhe",
    ),

    path("medicoes/", views.medicoes_api, name="api_medicoes"),

    path(
        "historico-sincronizacoes/",
        views.historico_sincronizacoes_api,
        name="api_historico_sincronizacoes",
    ),

    path("sincronizar/", views.sincronizar_geral_api, name="api_sincronizar"),

    path(
        "exportar/contratos/excel/",
        views.exportar_contratos_excel_api,
        name="api_exportar_contratos_excel",
    ),

    path(
        "exportar/medicoes/excel/",
        views.exportar_medicoes_excel_api,
        name="api_exportar_medicoes_excel",
    ),

    path(
        "relatorios/dashboard/pdf/",
        exportar_dashboard_pdf,
        name="api_relatorio_dashboard_pdf",
    ),
]