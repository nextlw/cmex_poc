# Bibliotecas padrão
import io
import json
import time

# Bibliotecas de terceiros
from fastapi import HTTPException
import anthropic
import cProfile
import pstats

# Imports locais
from ...config import (
    ERROR_MESSAGES,
    MODEL_MAPPING,
    PROMPT_TEMPLATE,
    SETTINGS,
    format_metrics_log,
    format_error_log,
    ERROR_TYPES,
    get_model_loggers,
    log_api_metrics,
    log_token_metrics,
    log_final_metrics,
)
from ...models.schemas import (
    ConsultaProduto,
)

# Inicialização dos loggers
logger, metrics_logger = get_model_loggers('claude')

def count_tokens_and_log(prompt: str, response: str, response_obj: dict) -> tuple[int, int]:
    """Conta tokens e retorna a contagem do prompt e da resposta usando a API Claude."""
    try:
        # Claude fornece contagem de tokens na resposta
        prompt_tokens = response_obj["usage"]["input_tokens"]
        response_tokens = response_obj["usage"]["output_tokens"]
        
        # Log das métricas de tokens
        log_token_metrics(metrics_logger, prompt, response, prompt_tokens, response_tokens)
        
        return prompt_tokens, response_tokens
    except Exception as e:
        logger.error(f"Erro ao contar tokens: {str(e)}")
        raise

async def obter_sugestoes_claude(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo Claude."""
    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["CLAUDE-3"]
        client = anthropic.Client(api_key=SETTINGS.ANTHROPIC_API_KEY)
        
        # Preparação do prompt usando o mesmo template do Gemini
        prompt = PROMPT_TEMPLATE(consulta_produto)
        
        # Chamada à API do Claude com parâmetros equivalentes
        response = client.messages.create(
            model=model_config["model_name"],
            messages=[{
                "role": "user",
                "content": prompt
            }],
            max_tokens=model_config["max_tokens"],
            temperature=model_config["temperature"],
            system="Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada."
        )
        
        # Extrai o conteúdo da resposta
        content = response.content[0].text
        
        # Processa a resposta usando o mesmo parser
        from ...utils.parsers import processar_resposta_modelo
        resultado = processar_resposta_modelo(content)
        
        return resultado

    except Exception as e:
        logger.error(f"Erro no processamento Claude: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=ERROR_MESSAGES["model_error"]
        )
