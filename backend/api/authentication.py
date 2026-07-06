from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Autenticação por sessão do Django sem exigir CSRF nas chamadas da API.

    Isso facilita a integração inicial com o frontend Next.js separado.
    Antes de publicar em produção, podemos endurecer essa parte usando CSRF
    corretamente ou migrando para autenticação por token/JWT.
    """

    def enforce_csrf(self, request):
        return