from fastapi import APIRouter, HTTPException
import anthropic
from ..config import settings, MODEL_MAPPING, ERROR_MESSAGES
from ..models.schemas import (
    ConsultaProduto,
    SugerirNCM,
    ValoresdeImpostos,
    ClassificacaoTributaria
)
import time
import logging
import json
import cProfile
import pstats
import io
from datetime import datetime

claude_router = APIRouter()

def count_tokens_and_log(prompt: str, response: str):
    """Conta tokens e salva em um arquivo de log"""
    client = anthropic.Client(api_key=settings.ANTHROPIC_API_KEY)
    
    # Contagem de tokens do prompt e resposta
    prompt_tokens = len(prompt.split())  # Simplificado, ajuste conforme necessário
    response_tokens = len(response.split())
    
    # Prepara o log
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "prompt_tokens": prompt_tokens,
        "response_tokens": response_tokens,
        "total_tokens": prompt_tokens + response_tokens,
        "prompt": prompt,
        "response": response
    }
    
    return prompt_tokens, response_tokens

@claude_router.post("/claude")
async def obter_sugestoes_claude(consulta_produto: ConsultaProduto):
    # Inicia o profiling
    pr = cProfile.Profile()
    pr.enable()
    
    try:
        start_time = time.time()
        
        # Log inicial
        logging.info(f"Iniciando processamento para consulta: {consulta_produto.consulta}")
        
        if not settings.ANTHROPIC_API_KEY:
            logging.error("API Key não configurada")
            raise HTTPException(
                status_code=500, 
                detail=ERROR_MESSAGES["api_key_missing"]
            )
        
        # Tempo para verificar a chave da API
        api_key_check_time = time.time() - start_time
        logging.info(f"Tempo para verificar API Key: {api_key_check_time:.2f} segundos")
        
        model_config = MODEL_MAPPING["CLAUDE-3"]
        client = anthropic.Client(api_key=settings.ANTHROPIC_API_KEY)
        
        logging.info(f"Recebendo consulta Claude: {consulta_produto.consulta}")
        texto = consulta_produto.consulta.strip()
        if len(texto) < 3:
            logging.warning("Texto muito curto para processamento")
            return []

        # Monta o prompt
        prompt = f"""
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

        logging.info("Enviando prompt para Claude")
        logging.debug(f"Prompt enviado para Anthropic: {prompt}")

        # Chamada à API da Anthropic com medição de tempo
        start_anthropic_call = time.time()
        message = client.messages.create(
            model=model_config["model_name"],
            max_tokens=model_config["max_tokens"],
            temperature=model_config["temperature"],
            system="Você é um especialista em classificação NCM e tributação de produtos.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        anthropic_call_time = time.time() - start_anthropic_call
        logging.info(f"Tempo para chamada Anthropic: {anthropic_call_time:.2f} segundos")

        # Extrai o conteúdo e conta tokens
        content = message.content[0].text
        prompt_tokens, response_tokens = count_tokens_and_log(prompt, content)
        
        logging.info(f"Tokens do prompt: {prompt_tokens}")
        logging.info(f"Tokens da resposta: {response_tokens}")
        logging.info(f"Resposta da Anthropic: {content}")

        try:
            data = json.loads(content)
            if not isinstance(data, list):
                data = [data]

            sugestoes = []
            for item in data:
                sugestoes.append(
                    SugerirNCM(
                        ncm=item.get("ncm", ""),
                        descricao=item.get("descricao", ""),
                        atributos=item.get("atributos", []),
                        valores_de_impostos=ValoresdeImpostos(
                            ipi=item.get("valores_de_impostos", {}).get("ipi", "0%"),
                            icms=item.get("valores_de_impostos", {}).get("icms", {}),
                            pis=item.get("valores_de_impostos", {}).get("pis", "1.65%"),
                            cofins=item.get("valores_de_impostos", {}).get("cofins", "7.6%")
                        ),
                        atributos_tipi=item.get("atributos_tipi", []),
                        classificacao_tributaria=ClassificacaoTributaria(
                            monofasico=str(item.get("classificacao_tributaria", {}).get("monofasico", False)).lower() in ['sim', 'true', '1', 'verdadeiro'],
                            aliquota_zero=str(item.get("classificacao_tributaria", {}).get("aliquota_zero", False)).lower() in ['sim', 'true', '1', 'verdadeiro'],
                            ipi_entrada=item.get("classificacao_tributaria", {}).get("ipi_entrada"),
                            ipi_saida=item.get("classificacao_tributaria", {}).get("ipi_saida"),
                            pis_entrada=item.get("classificacao_tributaria", {}).get("pis_entrada"),
                            pis_saida=item.get("classificacao_tributaria", {}).get("pis_saida"),
                            cofins_entrada=item.get("classificacao_tributaria", {}).get("cofins_entrada"),
                            cofins_saida=item.get("classificacao_tributaria", {}).get("cofins_saida"),
                            cst_entrada=item.get("classificacao_tributaria", {}).get("cst_entrada"),
                            cst_saida=item.get("classificacao_tributaria", {}).get("cst_saida")
                        )
                    )
                )

            logging.info(f"Lista parseada com sucesso: {sugestoes}")
            
            # Finaliza o profiling
            pr.disable()
            s = io.StringIO()
            ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
            ps.print_stats()
            
            total_time = time.time() - start_time
            logging.info(f"Tempo total de processamento: {total_time:.2f} segundos")
            
            return [sugestao.to_frontend_format() for sugestao in sugestoes]
            
        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar JSON: {e}\nConteúdo recebido: {content}")
            return []

    except Exception as e:
        logging.error(f"Erro no processamento: {str(e)}")
        raise