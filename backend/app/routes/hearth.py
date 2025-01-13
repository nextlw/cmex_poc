from fastapi import APIRouter

hearth_router = APIRouter()

@hearth_router.get("/health", response_model=str)
async def get_health_check() -> str:
    """Verifica se a API est  dispon vel"""
    return "ok"

