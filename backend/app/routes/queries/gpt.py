# Bibliotecas de terceiros
from fastapi import HTTPException
import openai

# Imports locais
from ...config import (
    ERROR_MESSAGES,
    MODEL_MAPPING,
    PROMPT_TEMPLATE,
    SETTINGS,
)
from ...models.schemas import (
    ConsultaProduto,
)

async def obter_sugestoes_gpt4(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo GPT-4."""
    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["GPT-4"]
        openai.api_key = SETTINGS.OPENAI_API_KEY
        
        # Preparação do prompt
        prompt = PROMPT_TEMPLATE(consulta_produto)
        
        # Chamada à API
        response = await openai.chat.completions.create(
            model=model_config["model_name"],
            messages=[
                {"role": "system", "content": "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada."},
                {"role": "user", "content": prompt}
            ],
            temperature=model_config["temperature"],
            max_tokens=model_config["max_tokens"],
        )

        # Processamento da resposta
        content = response.choices[0].message.content.strip()
        
        # Processamento centralizado da resposta
        from ...utils.parsers import processar_resposta_modelo
        resultado = processar_resposta_modelo(content)
        
        return resultado

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=ERROR_MESSAGES["model_error"]
        )

