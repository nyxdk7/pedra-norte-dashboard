from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),

    # API nova do backend
    path("api/", include("api.urls")),

    # Rotas antigas do Django com templates HTML
    path("", include("dashboard.urls")),
]