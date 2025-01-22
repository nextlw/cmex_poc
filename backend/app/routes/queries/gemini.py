# Bibliotecas padrão
import io
import json
import time

# Bibliotecas de terceiros
from fastapi import HTTPException
import google.generativeai as genai
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
logger, metrics_logger = get_model_loggers('gemini')

def count_tokens_and_log(prompt: str, response: str, response_obj: genai.types.GenerateContentResponse) -> tuple[int, int]:
    """Conta tokens e retorna a contagem do prompt e da resposta usando a API Gemini."""
    try:
        # Nota: Gemini não fornece contagem direta de tokens, então estimamos
        prompt_tokens = len(prompt.split())  # Estimativa simplificada
        response_tokens = len(response.split())  # Estimativa simplificada
        
        # Log das métricas de tokens
        log_token_metrics(metrics_logger, prompt, response, prompt_tokens, response_tokens)
        
        return prompt_tokens, response_tokens
    except Exception as e:
        logger.error(f"Erro ao contar tokens: {str(e)}")
        raise

async def obter_sugestoes_gemini(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo Gemini."""
    profiler = cProfile.Profile()
    profiler.enable()
    start_time = time.time()

    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["Gemini-1.5-pro"]
        genai.configure(api_key=SETTINGS.GOOGLE_API_KEY)
        model = genai.GenerativeModel(model_config["model_name"])

        # Preparação do prompt
        prompt = PROMPT_TEMPLATE.format(consulta_produto=consulta_produto)
        
        # Início da chamada à API
        start_call = time.time()
        response = model.generate_content(prompt)
        api_time = time.time() - start_call
        logger.info(f"Tempo de resposta Gemini: {api_time:.2f} segundos")

        # Processamento da resposta
        content = response.text.strip()
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
        logger.error(f"Erro ao decodificar JSON: {e}\nConteúdo recebido: {content}")
        error_data = format_error_log(
            error_type=ERROR_TYPES["json_decode"],
            error_message=str(e),
            extra_data={"content_received": content[:500]}  # Limita o tamanho do conteúdo no log
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
