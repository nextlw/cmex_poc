from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from .routes.openai import openai_router
from .routes.gemini import gemini_router
from .routes.claude import claude_router
from .routes.historico import historico_router
import os

app = FastAPI()

# Configuração CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:10000",
    "https://cmex-poc.onrender.com",
    "https://cmex-poc.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.head("/")
async def root():
    """Rota raiz para verificar se a API está disponível"""
    return Response(content="API está funcionando", media_type="text/plain")

# Inclui os roteadores com prefixo /api
app.include_router(gemini_router, prefix="/api")
app.include_router(openai_router, prefix="/api")
app.include_router(claude_router, prefix="/api")
app.include_router(historico_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)

    #uvicorn app.main:app --host 0.0.0.0 --port 10000