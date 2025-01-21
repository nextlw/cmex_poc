#  Bibliotecas
import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega as variáveis de ambiente
load_dotenv()

# Recupera o ambiente correto
ENV = os.getenv("ENV")

# Configurações do cliente Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


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

    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 10000

    # Configurações de CORS
    if ENV == "dev":
        BACKEND_CORS_ORIGINS: list = [
            "http://localhost:5173",  # Frontend React (Local)
            "http://127.0.0.1:5173",  # Frontend React (Local)
            "http://localhost:10000",  # Backend FastAPI (Local - Ele mesmo)
            "http://127.0.0.1:10000",  # Backend FastAPI (Local - Ele mesmo)
        ]
    elif ENV == "prod":
        BACKEND_CORS_ORIGINS: list = [
            "https://cmex-poc.onrender.com",  # Frontend React (Prod)
            "https://cmex-poc.vercel.app",  # Frontend React (Prod)
        ]

    # Configurações de logging
    LOG_LEVEL: str = "INFO"

    # Configurações de cache
    CACHE_TTL: int = 60 * 60  # 1 hora em segundos

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


# Criar uma instância única das configurações
@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Instância das configurações para uso em toda a aplicação
SETTINGS = get_settings()

# Constantes específicas da aplicação
PROMPT_TEMPLATE = """
            Você é um especialista em classificação NCM e tributação de produtos.
            Analise o seguinte produto e procure na tabela TIPI.
            Produto: {consulta_produto.consulta}
                Estado de origem: {consulta_produto.estadoOrigem or 'Não informado'}
                Operação: {consulta_produto.operacao or 'Não informado'}
                Regime tributário: {consulta_produto.regimeTributario or 'Não informado'}
                Tributação: {consulta_produto.tributacao or 'Não informado'}
                Reduções ou isenções locais: {consulta_produto.reducaoOuIsencao or 'Não informado'}
            
            Retorne APENAS um JSON, **SEM** texto adicional, no seguinte formato:
            {{
                "ncm": "XX.XX.XX.XX",
                "descricao": "Uma breve descrição do produto com base nas características da ncm encontrada",
                "atributos": ["...cada atributo deve ter como foco o produto que será cadastrado na duimp no novo sistema do governo CISCOMEX"],
                "atributos_tipi": ["...cada atributo deve der retirado do que tem daquela ncm na tabela tipi 2024"],
                "valores_de_impostos": {{
                    "ipi": "valor real do IPI",
                    "icms": {{"estado": "valor real do ICMS"}},
                    "pis": "valor real do PIS",
                    "cofins": "valor real do COFINS"
                }},
                "classificacao_tributaria": {{
                    "monofasico": valor real,
                    "aliquota_zero": valor real,
                    "ipi_entrada": "valor real do IPI na entrada",
                    "ipi_saida": "valor real do IPI na saída",
                    "pis_entrada": "valor real do PIS na entrada",
                    "pis_saida": "valor real do PIS na saída",
                    "cofins_entrada": "valor real do COFINS na entrada",
                    "cofins_saida": "valor real do COFINS na saída",
                    "cst_entrada": "valor real do CST de entrada",
                    "cst_saida": "valor real do CST de saída"
                }}
            }}
        """

# Mapeamento de modelos
MODEL_MAPPING = {
    "GPT-4": {
        "model_name": SETTINGS.OPENAI_MODEL,
        "max_tokens": 500,
        "temperature": 0.2,
    },
    "Gemini-1.5-pro": {
        "model_name": SETTINGS.GOOGLE_MODEL,
        "max_tokens": 500,
        "temperature": 0.2,
    },
    "CLAUDE-3": {
        "model_name": SETTINGS.ANTHROPIC_MODEL,  # ou outro modelo Claude disponível
        "max_tokens": 4096,
        "temperature": 0.7,
    },
}

# Configurações de resposta padrão
DEFAULT_RESPONSE = {
    "ncm": "",
    "descricao": "",
    "atributos": [],
    "atributos_tipi": [],
    "valores_de_impostos": {"ipi": "0%", "icms": {}, "pis": "1.65%", "cofins": "7.6%"},
}

# Mensagens de erro
ERROR_MESSAGES = {
    "api_key_missing": "Chave da API não configurada",
    "invalid_input": "Entrada inválida",
    "model_not_available": "Modelo não disponível",
    "service_error": "Erro no serviço",
}
