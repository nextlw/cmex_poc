# Bibliotecas padrão
import io
import json
import time

# Bibliotecas de terceiros
from fastapi import HTTPException
import openai
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
logger, metrics_logger = get_model_loggers('gpt')

def count_tokens_and_log(prompt: str, response: str, response_obj: dict) -> tuple[int, int]:
    """Conta tokens e retorna a contagem do prompt e da resposta usando a API OpenAI."""
    try:
        # OpenAI fornece contagem de tokens na resposta
        prompt_tokens = response_obj["usage"]["prompt_tokens"]
        response_tokens = response_obj["usage"]["completion_tokens"]
        
        # Log das métricas de tokens
        log_token_metrics(metrics_logger, prompt, response, prompt_tokens, response_tokens)
        
        return prompt_tokens, response_tokens
    except Exception as e:
        logger.error(f"Erro ao contar tokens: {str(e)}")
        raise

async def obter_sugestoes_gpt4(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo GPT-4."""
    profiler = cProfile.Profile()
    profiler.enable()
    start_time = time.time()

    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["GPT-4"]
        openai.api_key = SETTINGS.OPENAI_API_KEY
        print("PROMPT::::", PROMPT_TEMPLATE(consulta_produto))
        
        # Preparação do prompt
        prompt = PROMPT_TEMPLATE(consulta_produto)
        
        # Início da chamada à API
        start_call = time.time()
        response = await openai.chat.completions.create(
            model=model_config["model_name"],
            messages=[
                {"role": "system", "content": "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada."},
                {"role": "user", "content": prompt}
            ],
            temperature=model_config["temperature"],
            max_tokens=model_config["max_tokens"],
        )
        api_time = time.time() - start_call
        logger.info(f"Tempo de resposta GPT-4: {api_time:.2f} segundos")

        # Processamento da resposta
        content = response.choices[0].message.content.strip()
        prompt_tokens, response_tokens = count_tokens_and_log(prompt, content, response)
        
        # Log das métricas formatadas
        formatted_metrics = format_metrics_log(
            prompt_tokens=prompt_tokens,
            response_tokens=response_tokens,
            processing_time=api_time,
            model=model_config["model_name"]
        )
        metrics_logger.info(f"\n{formatted_metrics}")
        
        # Log das métricas da API
        log_api_metrics(
            metrics_logger,
            api_time,
            model_config["model_name"],
            prompt_tokens,
            response_tokens,
            consulta_produto.consulta
        )
        
        # Processamento centralizado da resposta
        from ...utils.parsers import processar_resposta_modelo
        resultado = processar_resposta_modelo(content)
        
        total_time = time.time() - start_time
        logger.info(f"Tempo total de processamento: {total_time:.2f} segundos")
        
        # Log final de métricas
        log_final_metrics(metrics_logger, total_time, len(resultado))
        
        return resultado

    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {e}\nConteúdo recebido: {content[:500]}")
        error_data = format_error_log(
            error_type=ERROR_TYPES["json_decode"],
            error_message=str(e),
            extra_data={"content_received": content[:500]}
        )
        metrics_logger.error(json.dumps(error_data))
        return []
    except Exception as e:
        logger.error(f"Erro no processamento: {str(e)}")
        error_data = format_error_log(
            error_type=ERROR_TYPES["processing"],
            error_message=str(e),
            extra_data={
                "consulta": consulta_produto.consulta,
                "model": model_config["model_name"]
            }
        )
        metrics_logger.error(json.dumps(error_data))
        raise
    finally:
        # Finalização do profiling
        profiler.disable()
        stats_stream = io.StringIO()
        pstats.Stats(profiler, stream=stats_stream).sort_stats("cumulative").print_stats()
        logger.debug(f"Profile stats:\n{stats_stream.getvalue()}")

