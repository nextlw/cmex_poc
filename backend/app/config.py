#  Bibliotecas
import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler
import json

# Carrega as variáveis de ambiente
load_dotenv()

# Ambiente
ENV = os.getenv("ENV", "dev")

print("ENV:::::",ENV)

# Configurações do cliente Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Configuração de logging centralizada
def setup_logger(name: str, log_file: str, level=logging.INFO):
    """Configura um logger personalizado com saída para arquivo e console."""
    try:
        # Obtém o logger existente ou cria um novo
        logger = logging.getLogger(name)
        
        # Se o logger já foi configurado, retorna ele
        if logger.handlers:
            return logger
            
        # Cria o diretório de logs se não existir
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_file_path = os.path.join(log_dir, log_file)
        
        # Configura o logger
        logger.setLevel(level)
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Handler para arquivo com rotação (máximo 10MB por arquivo, mantém 5 backups)
        file_handler = RotatingFileHandler(
            log_file_path,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8',
            mode='a',
            delay=False
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        # Handler para console
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # Evita propagação para evitar logs duplicados
        logger.propagate = False
        
        # Força flush após cada mensagem
        def force_flush(record):
            file_handler.flush()
            console_handler.flush()
            return True
            
        logger.addFilter(force_flush)
        
        # Teste inicial do logger
        logger.info(f"Logger '{name}' iniciado com sucesso. Arquivo: {log_file_path}")
        
        return logger
        
    except Exception as e:
        print(f"Erro ao configurar logger: {str(e)}")
        raise

# Configuração dos loggers globais
def get_model_loggers(model_name: str):
    """Retorna os loggers específicos para cada modelo."""
    try:
        api_logger = setup_logger(f'{model_name}_api', f'{model_name}_api.log')
        metrics_logger = setup_logger(f'{model_name}_metrics', f'{model_name}_metrics.log')
        
        # Teste inicial dos loggers
        api_logger.info(f"Sistema de logging do {model_name} iniciado")
        metrics_logger.info(json.dumps({
            "timestamp": datetime.now().isoformat(),
            "event": "logging_system_start",
            "model": model_name,
            "status": "success"
        }))
        
        return api_logger, metrics_logger
    except Exception as e:
        print(f"Erro ao inicializar loggers para {model_name}: {str(e)}")
        raise

def log_api_metrics(metrics_logger, api_time: float, model_name: str, prompt_tokens: int, response_tokens: int, consulta: str):
    """Registra métricas da API em formato JSON."""
    metrics_logger.info(json.dumps({
        "timestamp": datetime.now().isoformat(),
        "api_response_time": api_time,
        "model": model_name,
        "prompt_tokens": prompt_tokens,
        "response_tokens": response_tokens,
        "total_tokens": prompt_tokens + response_tokens,
        "tokens_per_second": (prompt_tokens + response_tokens) / api_time if api_time > 0 else 0,
        "consulta": consulta,
        "cost_estimate_usd": ((prompt_tokens + response_tokens) / 1000) * 0.0005,
    }))

def log_token_metrics(metrics_logger, prompt: str, response: str, prompt_tokens: int, response_tokens: int):
    """Registra métricas de tokens em formato JSON."""
    metrics_logger.info(json.dumps({
        "timestamp": datetime.now().isoformat(),
        "prompt_tokens": prompt_tokens,
        "response_tokens": response_tokens,
        "total_tokens": prompt_tokens + response_tokens,
        "cost_estimate_usd": ((prompt_tokens + response_tokens) / 1000) * 0.0005,
        "prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt,
        "response_preview": response[:100] + "..." if len(response) > 100 else response,
    }))

def log_final_metrics(metrics_logger, total_time: float, num_suggestions: int):
    """Registra métricas finais do processamento."""
    metrics_logger.info(json.dumps({
        "timestamp": datetime.now().isoformat(),
        "total_processing_time": total_time,
        "status": "success",
        "num_suggestions": num_suggestions,
    }))

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
    BACKEND_CORS_ORIGINS: list[str] = [
        "https://nexcode-homolog-g7lk.onrender.com",
        "https://nexcode-homolog.onrender.com",
        "https://cmex-poc-1.onrender.com",
        "https://cmex-poc.onrender.com",
        "https://cmex-poc.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:10000",
        "http://127.0.0.1:10000",
        "https://localhost:5173",
        "https://127.0.0.1:5173"
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
        "Access-Control-Request-Headers"
    ]
    CORS_EXPOSE_HEADERS: list[str] = ["*"]
    CORS_MAX_AGE: int = 600  # 10 minutos em segundos

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
                "atributos": ["...cada atributo deve ter como foco o produto que será cadastrado na duimp no novo sistema do governo CISCOMEX"],
                "atributos_tipi": ["...cada atributo deve der retirado do que tem daquela ncm na tabela tipi 2024"],
                "valores_de_impostos": {{
                    "ipi": "valor real do IPI",
                    "icms": {{"estado": "valor real do ICMS"}},
                    "pis": "valor real do PIS",
                    "cofins": "valor real do COFINS"
                }},
                "classificacao_tributaria": {{
                    "tipo_classificacao_tributario": {{
                        "operacao_tributavel": {{
                            "aliquota_basica": {{"codigo": "01", "valor": false}},
                            "aliquota_diferenciada": {{"codigo": "02", "valor": false}},
                            "aliquota_unidade_medida": {{"codigo": "03", "valor": false}},
                            "substituicao_tributaria": {{"codigo": "05", "valor": false}}
                        }},
                        "operacao_monofasica_aliquota_zero": {{
                            "monofasica_revenda": {{"codigo": "04", "valor": false}},
                            "aliquota_zero": {{"codigo": "06", "valor": false}}
                        }},
                        "operacao_nao_tributavel": {{
                            "isenta": {{"codigo": "07", "valor": false}},
                            "sem_incidencia": {{"codigo": "08", "valor": false}},
                            "suspensa": {{"codigo": "09", "valor": false}}
                        }},
                        "operacao_outros": {{
                            "outras_saidas": {{"codigo": "49", "valor": false}},
                            "credito_mercado_interno": {{"codigo": "50", "valor": false}},
                            "credito_nao_tributado": {{"codigo": "51", "valor": false}},
                            "credito_exportacao": {{"codigo": "52", "valor": false}},
                            "credito_tributado_nao_tributado": {{"codigo": "53", "valor": false}},
                            "credito_tributado_exportacao": {{"codigo": "54", "valor": false}},
                            "credito_nao_tributado_exportacao": {{"codigo": "55", "valor": false}},
                            "credito_tributado_nao_tributado_exportacao": {{"codigo": "56", "valor": false}}
                        }},
                        "operacao_credito_presumido": {{
                            "mercado_interno": {{"codigo": "60", "valor": false}},
                            "nao_tributado": {{"codigo": "61", "valor": false}},
                            "exportacao": {{"codigo": "62", "valor": false}},
                            "tributado_nao_tributado": {{"codigo": "63", "valor": false}},
                            "tributado_exportacao": {{"codigo": "64", "valor": false}},
                            "nao_tributado_exportacao": {{"codigo": "65", "valor": false}},
                            "tributado_nao_tributado_exportacao": {{"codigo": "66", "valor": false}},
                            "outras_operacoes": {{"codigo": "67", "valor": false}}
                        }},
                        "operacao_aquisicao": {{
                            "sem_credito": {{"codigo": "70", "valor": false}},
                            "isenta": {{"codigo": "71", "valor": false}},
                            "suspensa": {{"codigo": "72", "valor": false}},
                            "aliquota_zero": {{"codigo": "73", "valor": false}},
                            "sem_incidencia": {{"codigo": "74", "valor": false}},
                            "substituicao_tributaria": {{"codigo": "75", "valor": false}}
                        }},
                        "operacao_outras": {{
                            "outras_entradas": {{"codigo": "98", "valor": false}},
                            "outras_operacoes": {{"codigo": "99", "valor": false}}
                        }}
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
            - Analise cuidadosamente as tabelas EFD Contribuições da Receita Federal
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

# Funções de utilidade para métricas
def format_metrics_log(
    prompt_tokens: int,
    response_tokens: int,
    processing_time: float,
    model: str
) -> str:
    """
    Formata as métricas de processamento em um formato legível.
    
    Args:
        prompt_tokens: Número de tokens no prompt
        response_tokens: Número de tokens na resposta
        processing_time: Tempo total de processamento em segundos
        model: Nome do modelo utilizado
    
    Returns:
        String formatada com as métricas principais
    """
    total_tokens = prompt_tokens + response_tokens
    tokens_per_second = total_tokens / processing_time if processing_time > 0 else 0
    
    metrics_formatted = f"""
    {'='*50}
    MÉTRICAS DE PROCESSAMENTO - {model}
    {'='*50}
    Tempo de Processamento: {processing_time:.2f} segundos
    Tokens:
        - Entrada (Prompt): {prompt_tokens:,} tokens
        - Saída (Resposta): {response_tokens:,} tokens
        - Total: {total_tokens:,} tokens
    Performance:
        - Velocidade: {tokens_per_second:.2f} tokens/segundo
        - Custo Estimado: USD ${((total_tokens / 1000) * 0.015):.4f}
    {'='*50}
    """
    return metrics_formatted

def format_error_log(error_type: str, error_message: str, extra_data: dict = None) -> dict:
    """
    Formata logs de erro de forma padronizada.
    
    Args:
        error_type: Tipo do erro (ex: json_decode_error, processing_error)
        error_message: Mensagem detalhada do erro
        extra_data: Dados adicionais para incluir no log (opcional)
    
    Returns:
        Dicionário formatado com informações do erro
    """
    error_log = {
        "timestamp": datetime.now().isoformat(),
        "error_type": error_type,
        "error_message": str(error_message),
        "status": "error"
    }
    
    if extra_data:
        error_log.update(extra_data)
    
    return error_log

# Tipos de erro padronizados
ERROR_TYPES = {
    "json_decode": "json_decode_error",
    "processing": "processing_error",
    "api_error": "api_error",
    "validation": "validation_error",
    "token_count": "token_count_error"
}

def converter_para_booleano(valor: str) -> bool:
    """Converte um valor string para booleano."""
    return str(valor).lower() in ["sim", "true", "1", "verdadeiro"]

