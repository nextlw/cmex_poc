# Bibliotecas padrão
import io
import json
import time
from datetime import datetime

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
    SugerirNCM,
    ValoresdeImpostos,
    ClassificacaoTributaria,
)

# Inicialização dos loggers
logger, metrics_logger = get_model_loggers('claude')

def converter_para_booleano(valor: str) -> bool:
    """Converte um valor string para booleano."""
    return str(valor).lower() in ["sim", "true", "1", "verdadeiro"]

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

def criar_sugestao_ncm(item: dict) -> SugerirNCM:
    """Cria um objeto SugerirNCM a partir de um dicionário de dados."""
    return SugerirNCM(
        ncm=item.get("ncm", ""),
        descricao=item.get("descricao", ""),
        atributos=item.get("atributos", []),
        atributos_tipi=item.get("atributos_tipi", []),
        valores_de_impostos=ValoresdeImpostos(
            ipi=item.get("valores_de_impostos", {}).get("ipi", "0%"),
            icms=item.get("valores_de_impostos", {}).get("icms", {}),
            pis=item.get("valores_de_impostos", {}).get("pis", "1.65%"),
            cofins=item.get("valores_de_impostos", {}).get("cofins", "7.6%"),
        ),
        classificacao_tributaria=ClassificacaoTributaria(
            monofasico=converter_para_booleano(
                item.get("classificacao_tributaria", {}).get("monofasico", False)
            ),
            aliquota_zero=converter_para_booleano(
                item.get("classificacao_tributaria", {}).get("aliquota_zero", False)
            ),
            ipi_entrada=item.get("classificacao_tributaria", {}).get("ipi_entrada"),
            ipi_saida=item.get("classificacao_tributaria", {}).get("ipi_saida"),
            pis_entrada=item.get("classificacao_tributaria", {}).get("pis_entrada"),
            pis_saida=item.get("classificacao_tributaria", {}).get("pis_saida"),
            cofins_entrada=item.get("classificacao_tributaria", {}).get("cofins_entrada"),
            cofins_saida=item.get("classificacao_tributaria", {}).get("cofins_saida"),
            cst_entrada=item.get("classificacao_tributaria", {}).get("cst_entrada") or "",
            cst_saida=item.get("classificacao_tributaria", {}).get("cst_saida") or "",
        ),
    )

async def obter_sugestoes_claude(consulta_produto: ConsultaProduto):
    """Obtém sugestões de classificação NCM usando Claude."""
    profiler = cProfile.Profile()
    profiler.enable()
    start_time = time.time()

    try:
        # Validação da API key
        if not SETTINGS.ANTHROPIC_API_KEY:
            logger.error("API Key não configurada")
            raise HTTPException(status_code=500, detail=ERROR_MESSAGES["api_key_missing"])

        # Validação da consulta
        texto = consulta_produto.consulta.strip()
        if len(texto) < 3:
            logger.warning("Texto muito curto para processamento")
            return []

        # Configuração do cliente Claude
        model_config = MODEL_MAPPING["CLAUDE-3"]
        client = anthropic.Anthropic(api_key=SETTINGS.ANTHROPIC_API_KEY)

        # Preparação e envio do prompt
        prompt = PROMPT_TEMPLATE.format(consulta_produto=consulta_produto)
        logger.info("Enviando prompt para Claude")
        logger.debug(f"Prompt enviado para Claude: {prompt}")

        # Chamada à API
        start_call = time.time()
        response = client.messages.create(
            model=model_config["model_name"],
            messages=[{"role": "user", "content": prompt}],
            temperature=model_config["temperature"],
            max_tokens=model_config["max_tokens"],
        )
        api_time = time.time() - start_call
        logger.info(f"Tempo de resposta Claude: {api_time:.2f} segundos")

        # Processamento da resposta
        content = response.content[0].text.strip()
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
        
        data = json.loads(content)

        # Conversão para lista se necessário
        if not isinstance(data, list):
            data = [data]

        # Criação das sugestões
        sugestoes = [criar_sugestao_ncm(item) for item in data]
        
        # Log das sugestões
        logger.info(f"Lista parseada com sucesso: {sugestoes}")

        # Formatação final
        resultado = [sugestao.to_frontend_format() for sugestao in sugestoes]
        
        total_time = time.time() - start_time
        logger.info(f"Tempo total de processamento: {total_time:.2f} segundos")
        
        # Log final de métricas
        log_final_metrics(metrics_logger, total_time, len(sugestoes))
        
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
