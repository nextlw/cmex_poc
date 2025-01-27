# Bibliotecas de terceiros
from fastapi import HTTPException
import openai
from openai import AuthenticationError, APIError

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

async def obter_sugestoes_deepseek(consulta_produto: ConsultaProduto):
    """Obtém sugestões de NCM usando o modelo DeepSeek."""
    try:
        # Configuração do modelo
        model_config = MODEL_MAPPING["DeepSeek"]
        
        # Configuração do cliente OpenAI para DeepSeek
        client = openai.OpenAI(
            api_key=SETTINGS.DEEPSEEK_API_KEY,
            base_url=SETTINGS.DEEPSEEK_API_BASE
        )
        
        # Preparação do prompt
        prompt = PROMPT_TEMPLATE(consulta_produto)
        
        # Chamada à API
        response = client.chat.completions.create(
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

    except AuthenticationError as e:
        print(f"Erro de autenticação DeepSeek: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Erro de autenticação com a API do DeepSeek. Verifique sua chave API."
        )
    except APIError as e:
        print(f"Erro da API DeepSeek: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro na API do DeepSeek: {str(e)}"
        )
    except Exception as e:
        print(f"Erro inesperado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=ERROR_MESSAGES["model_error"]
        )

