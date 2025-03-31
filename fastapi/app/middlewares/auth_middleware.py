# Bibliotecas
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response
from app.config import supabase, SETTINGS
from gotrue.errors import AuthApiError
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Schemas
from ..models.error import Erro, ErrorDetail


# Handler de autenticação
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):

        # Pega a origem do request
        origin = request.headers.get("origin")
        logger.info(f"Request recebido de: {origin}")

        # Tratamento para requisições preflight (OPTIONS)
        if request.method == "OPTIONS" and origin in SETTINGS.BACKEND_CORS_ORIGINS:
            logger.info("Requisição preflight OPTIONS")
            return Response(
                status_code=204,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "600"
                },
            )

        # Verifica se a rota é pública
        if request.url.path in ["/", "/login", "/api/v1/autocomplete", "/api/v1/queries", "/api/queries", "/api/autocomplete"]:  # Lista de rotas públicas
            logger.info(f"Rota pública acessada: {request.url.path}")
            response = await call_next(request)
            return response

        # Pega o header de Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning("Token de autenticação não fornecido")
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
                status_code=error.status_code, 
                content=error.model_dump(),
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true"
                } if origin in SETTINGS.BACKEND_CORS_ORIGINS else {}
            )

        try:
            
            # Assumindo o formato "Bearer <token>"
            token = auth_header.split(" ")[1]
            logger.info("Token recebido, validando...")

            # Valida o token usando Supabase
            user = supabase.auth.get_user(token)
            logger.info(f"Token válido para usuário: {user.user.id}")

            if user:
                # Armazena o usuário no contexto da requisição
                request.state.user = user.user
                response = await call_next(request)
                
                # Adiciona headers CORS na resposta
                if origin in SETTINGS.BACKEND_CORS_ORIGINS:
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                
                return response

        except AuthApiError as e:
            logger.error(f"Erro de autenticação: {str(e)}")
            # Monta a mensagem de erro
            error = Erro(
                status_code=401,
                errors=[
                    ErrorDetail(
                        loc=["header", "Authorization"],
                        msg=str(e),
                        type="invalid_token",
                        ctx=None,
                    )
                ],
                message="Token inválido ou expirado",
            )

            return JSONResponse(
                status_code=error.status_code, 
                content=error.model_dump(),
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true"
                } if origin in SETTINGS.BACKEND_CORS_ORIGINS else {}
            )
