from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.openai import openai_router
from .routes.gemini import gemini_router
from .routes.claude import claude_router
from .routes.historico import historico_router
from .routes.hearth import hearth_router
app = FastAPI()

# Configuração CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:10000",
    "https://pocrender-569a.onrender.com",
    "https://cmex-poc.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui os roteadores com prefixo /api
app.include_router(gemini_router, prefix="/api")
app.include_router(openai_router, prefix="/api")
app.include_router(claude_router, prefix="/api")
app.include_router(historico_router, prefix="/api")
app.include_router(hearth_router, prefix="/api")


# Executar via Uvicorn (opcional; caso já faça isso de outra forma, remova)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)