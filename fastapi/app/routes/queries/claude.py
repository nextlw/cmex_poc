# Bibliotecas de terceiros
from fastapi import HTTPException
import anthropic

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
        raise HTTPException(
            status_code=500,
            detail=ERROR_MESSAGES["model_error"]
        )
