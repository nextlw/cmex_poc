#  Bibliotecas
import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega as variáveis de ambiente
load_dotenv()

# Ambiente
ENV = os.getenv("ENV", "dev")  # Valor padrão: "dev"

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

    # Configurações do DeepSeek
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_API_BASE: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # Configurações do Gemini
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_MODEL: str = "gemini-1.5-pro"

    # Configurações do Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"

    # Configurações do vite
    VITE_API_LOCAL_URL: str = os.getenv("VITE_API_LOCAL_URL", "")
    LOCAL_MODEL: str = "qwen2.5-7b-instruct-1m"

    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 10000

    # Configurações de CORS - Permitindo acesso de qualquer origem em desenvolvimento
    # Independentemente do valor de ENV, sempre permita localhost:5173
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:6378",
        "http://localhost:10000",
        "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:10000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:6378",
    ]

    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: list[str] = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "content-type",  # Adicionando explicitamente
    ]
    CORS_EXPOSE_HEADERS: list[str] = ["*"]
    CORS_MAX_AGE: int = 600  # 10 minutos em segundos

    # Configurações de logging
    LOG_LEVEL: str = "INFO"

    # Configurações de cache
    CACHE_TTL: int = 60 * 60  # 1 hora em segundos

    # Configurações do modelo Qwen
    LOCAL_MODEL_URL: str = (
        "http://localhost:1234"  # URL do servidor local do modelo Qwen
    )

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


def format_prompt(consulta_produto):
    return f"""
            Você é um especialista em classificação NCM e tributação de produtos.
            Analise o seguinte produto e procure na tabela TIPI.
            Produto: {consulta_produto.consulta}
                Estado de origem: {consulta_produto.estadoOrigem}
                Operação: {consulta_produto.operacao if consulta_produto.operacao else "Não informado"}
                Regime tributário: {consulta_produto.regimeTributario if consulta_produto.regimeTributario else "Não informado"}
                Tributação: {consulta_produto.tributacao if consulta_produto.tributacao else "Não informado"}
            
            Retorne APENAS um JSON, **SEM** texto adicional, no seguinte formato:
            {{
                "ncm": "XX.XX.XX.XX",
                "descricao": "Uma breve descrição do produto com base nas características da ncm encontrada",
                "atributos": ["...cada atributo deve ter como foco o produto que será cadastrado na duimp no novo sistema do governo CISCOMEX, eles podem ser encontrados na api https://api-docs.portalunico.siscomex.gov.br/swagger/cadatributos.html#/Relação%20de%20Atributos/consultarCodigo"],
                "valores_de_impostos": {{
                    "ipi": "valor real do IPI",
                    "icms": {{"estado": "valor real do ICMS"}},
                    "pis": "valor real do PIS",
                    "cofins": "valor real do COFINS"
                }},
                "classificacao_tributaria": {{
                    "tipo_classificacao_tributario": {{
                        "tipo_tributario_ativo": "Como especialista tributário, analise cuidadosamente as tabelas EFD Contribuições da Receita Federal utilizando o ncm que você encontrou e as características do produto, operação e enquadramento nas tabelas acima.
                    Utilize as tabelas 4.3.1 a 4.3.6 do Manual EFD Contribuições para determinar o tipo tributário.
                    - Considere:
                        * Tabela 4.3.1: Tabela Código de Situação Tributária – CST PIS/PAS
                        * Tabela 4.3.2: Tabela Código de Situação Tributária – CST COFINS
                        * Tabela 4.3.3: Tabela Código de Contribuição Social Apurada
                        * Tabela 4.3.4: Tabela Código de Tipo de Crédito
                        * Tabela 4.3.5: Tabela Código de Base de Cálculo do Crédito
                        * Tabela 4.3.6: Tabela Código de Ajuste de Contribuição ou Crédito",
                        "justificativa": "Explique detalhadamente o motivo da escolha deste tipo tributário, citando as características do produto, legislação aplicável e tabelas consultadas."
                    }},
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
            
            IMPORTANTE sobre o tipo_tributario:
            - Como especialista tributário, analise cuidadosamente as tabelas EFD Contribuições da Receita Federal
            - Utilize as tabelas 4.3.1 a 4.3.6 do Manual EFD Contribuições para determinar o tipo tributário correto
            - Considere:
                * Tabela 4.3.1: Tabela Código de Situação Tributária – CST PIS/PASEP
                * Tabela 4.3.2: Tabela Código de Situação Tributária – CST COFINS
                * Tabela 4.3.3: Tabela Código de Contribuição Social Apurada
                * Tabela 4.3.4: Tabela Código de Tipo de Crédito
                * Tabela 4.3.5: Tabela Código de Base de Cálculo do Crédito
                * Tabela 4.3.6: Tabela Código de Ajuste de Contribuição ou Crédito
            - O tipo_tributario_ativo deve ser determinado com base nas características do produto, operação e enquadramento nas tabelas acima
            - O tipo_tributario_ativo deve ser retornado no formato "XX - Descrição Completa da Operação", onde XX é o código da operação
            - Retorne apenas um tipo tributário que for true, baseado na análise das tabelas EFD Contribuições e nas características do produto
            - Forneça uma justificativa detalhada explicando o motivo da escolha do tipo tributário

    """


# Constantes específicas da aplicação
PROMPT_TEMPLATE = format_prompt

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
    "DeepSeek": {
        "model_name": SETTINGS.DEEPSEEK_MODEL,
        "max_tokens": 700,
        "temperature": 1.3,
    },
    "qwen2.5-7b-instruct-1m": {
        "model_name": SETTINGS.LOCAL_MODEL,
        "max_tokens": 10000,
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
    "cors_error": "Erro de CORS: Origem não permitida",
    "preflight_error": "Erro na requisição preflight CORS",
    "method_not_allowed": "Método HTTP não permitido para esta origem",
}

# Tipos de erro padronizados
ERROR_TYPES = {
    "json_decode": "json_decode_error",
    "processing": "processing_error",
    "api_error": "api_error",
    "validation": "validation_error",
    "token_count": "token_count_error",
}


def converter_para_booleano(valor: str) -> bool:
    """Converte um valor string para booleano."""
    return str(valor).lower() in ["sim", "true", "1", "verdadeiro"]
