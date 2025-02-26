# Bibliotecas de terceiros
from fastapi import HTTPException
import google.generativeai as genai

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

async def obter_sugestoes_gemini(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo Gemini."""
    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["Gemini-1.5-pro"]
        genai.configure(api_key=SETTINGS.GOOGLE_API_KEY)
        model = genai.GenerativeModel(model_config["model_name"])

        # Preparação do prompt
        prompt = PROMPT_TEMPLATE(consulta_produto)
        
        # Chamada à API
        response = model.generate_content(prompt)

        # Processamento da resposta
        content = response.text.strip()
        
        # Processamento centralizado da resposta
        from ...utils.parsers import processar_resposta_modelo
        resultado = processar_resposta_modelo(content)
        
        return resultado

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=ERROR_MESSAGES["model_error"]
        )
