from django.contrib.auth import views as auth_views
from django.urls import path

from . import views


urlpatterns = [
    path(
        "login/",
        auth_views.LoginView.as_view(
            template_name="dashboard/login.html",
        ),
        name="login",
    ),

    path(
        "logout/",
        auth_views.LogoutView.as_view(
            next_page="login",
        ),
        name="logout",
    ),

    path("", views.home, name="home"),
    path("teste-sheets/", views.teste_sheets, name="teste_sheets"),

    path("sincronizar/", views.sincronizar_geral, name="sincronizar_geral"),
    path(
        "api/sincronizar/",
        views.sincronizar_geral_api,
        name="sincronizar_geral_api",
    ),

    path("contratos/", views.contratos, name="contratos"),
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

    path("medicoes/", views.medicoes, name="medicoes"),
    path(
        "sincronizar-medicoes/",
        views.sincronizar_medicoes,
        name="sincronizar_medicoes",
    ),
]
