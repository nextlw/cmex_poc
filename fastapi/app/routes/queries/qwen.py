from fastapi import HTTPException
import aiohttp
from ...config import (
    ERROR_MESSAGES,
    MODEL_MAPPING,
    PROMPT_TEMPLATE,
    SETTINGS,
)
from ...models.schemas import (
    ConsultaProduto,
)

async def obter_sugestoes_qwen(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo Qwen local."""
    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["qwen2.5-7b-instruct-1m"]
        
        # Preparação do prompt
        prompt = PROMPT_TEMPLATE(consulta_produto)
        
        # Configuração da requisição para o servidor local
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SETTINGS.LOCAL_MODEL_URL}/v1/chat/completions",
                json={
                    "model": model_config["model_name"],
                    "messages": [
                        {
                            "role": "system",
                            "content": "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada. Não inclua texto adicional ou explicações fora do JSON."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": model_config["temperature"],
                    "max_tokens": model_config["max_tokens"],
                    "stream": False
                }
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Erro na API do modelo local: {await response.text()}"
                    )
                
                result = await response.json()
                
                if not result.get("choices") or not result["choices"][0].get("message"):
                    raise HTTPException(
                        status_code=500,
                        detail="Resposta inválida do modelo local"
                    )
                
                content = result["choices"][0]["message"]["content"].strip()
                
                # Processamento centralizado da resposta
                from ...utils.parsers import processar_resposta_modelo
                resultado = processar_resposta_modelo(content)
                
                return resultado

    except aiohttp.ClientError as e:
        print(f"Erro de conexão com modelo local: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Erro de conexão com o modelo local. Verifique se o servidor está rodando."
        )
    except Exception as e:
        print(f"Erro inesperado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=ERROR_MESSAGES["model_error"]
        ) 