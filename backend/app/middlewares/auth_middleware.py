# Bibliotecas
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response
from app.config import supabase, SETTINGS

# Schemas
from ..models.error import Erro, ErrorDetail


# Handler de autenticação
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):

        # Tratamento para requisições preflight (OPTIONS)
        if request.method == "OPTIONS":
            return Response(
                status_code=204,
                headers={
                    "Access-Control-Allow-Origin": SETTINGS.BACKEND_CORS_ORIGINS,
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            )

        # Verifica se a rota é pública
        if request.url.path in ["/", "/login"]:  # Lista de rotas públicas
            response = await call_next(request)
            return response

        # Pega o header de Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header:

            # Monta a mensagem de erro
            error = Erro(
                status_code=401,
                errors=[
                    ErrorDetail(
                        loc=["header", "Authorization"],
                        msg="Token de autenticação não fornecido",
                        type="missing",
                        ctx=None,
                    )
                ],
                message="Token de autenticação não fornecido",
            )

            return JSONResponse(
                status_code=error.status_code, content=error.model_dump()
            )

        try:
            # Assumindo o formato "Bearer <token>"
            token = auth_header.split(" ")[1]

            # Valida o token usando Supabase
            user = supabase.auth.get_user(token)

            if user:
                # Armazena o usuário no contexto da requisição
                request.state.user = user.user
                response = await call_next(request)
                return response

        except Exception as e:

            # Monta a mensagem de erro
            error = Erro(
                status_code=401,
                errors=[
                    ErrorDetail(
                        loc=["header", "Authorization"],
                        msg="Token inválido ou expirado",
                        type="invalid_token",
                        ctx=None,
                    )
                ],
                message="Token inválido ou expirado",
            )

            return JSONResponse(
                status_code=error.status_code, content=error.model_dump()
            )
