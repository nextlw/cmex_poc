import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Configurações da API
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "NCM API"
    
    # Configurações do OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4"
    
    # Configurações do Gemini
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_MODEL: str = "gemini-1.5-pro"
    
    # Configurações do Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"
    
    # Configurações do PYTHONANYWARE
    PYTHONANYWARE_API_KEY: str = os.getenv("PYTHONANYWARE_API_KEY", "")
    
    
    
    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 10000
    
    # Configurações de CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
        "http://localhost:10000"
    ]
    
    # Configurações de logging
    LOG_LEVEL: str = "INFO"
    
    # Configurações de cache
    CACHE_TTL: int = 60 * 60  # 1 hora em segundos
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Criar uma instância única das configurações
@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Instância das configurações para uso em toda a aplicação
settings = get_settings()

# Constantes específicas da aplicação
PROMPT_TEMPLATE = """
    Você é um especialista em classificação NCM e tributação de produtos.
    Analise o seguinte produto e procure na tabela TIPI.
    Produto: {consulta}
        Estado de origem: {estado_origem}
        Operação: {operacao}
        Regime tributário: {regime_tributario}
        Tributação: {tributacao}
        Reduções ou isenções locais: {reducao_isencao}
"""

# Mapeamento de modelos
MODEL_MAPPING = {
    "GPT-4": {
        "model_name": settings.OPENAI_MODEL,
        "max_tokens": 500,
        "temperature": 0.2
    },
    "Gemini-1.5-pro": {
        "model_name": settings.GOOGLE_MODEL,
        "max_tokens": 500,
        "temperature": 0.2
    },
    "CLAUDE-3": {
        "model_name": settings.ANTHROPIC_MODEL,  # ou outro modelo Claude disponível
        "max_tokens": 4096,
        "temperature": 0.7
    },
    "PYTHONANYWARE": {
        "API_TOKEN": settings.PYTHONANYWARE_API_KEY,
    }
}

# Configurações de resposta padrão
DEFAULT_RESPONSE = {
    "ncm": "",
    "descricao": "",
    "atributos": [],
    "atributos_tipi": [],
    "valores_de_impostos": {
        "ipi": "0%",
        "icms": {},
        "pis": "1.65%",
        "cofins": "7.6%"
    }
}

# Mensagens de erro
ERROR_MESSAGES = {
    "api_key_missing": "Chave da API não configurada",
    "invalid_input": "Entrada inválida",
    "model_not_available": "Modelo não disponível",
    "service_error": "Erro no serviço"
}