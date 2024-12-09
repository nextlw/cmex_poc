from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import openai
import os

app = FastAPI()

# Configuração da chave de API da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise HTTPException(status_code=500, detail="A chave de API da OpenAI não está definida.")

origins = ["https://localhost:3000", "https://localhost:8000"]
# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Altere para o domínio do seu frontend em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProductQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Texto de busca do produto")

class ProductSuggestion(BaseModel):
    ncm: str = Field(..., description="Código NCM do produto")
    description: str = Field(..., description="Descrição do produto")
    attributes: Optional[List[str]] = Field(default=None, description="Lista de atributos do produto")

class ProductResponse(BaseModel):
    suggestions: List[ProductSuggestion]

class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Mensagem de erro")

class HealthCheck(BaseModel):
    status: str = Field(..., description="Status da API")

class OpenAIRequest(BaseModel):
    prompt: str
    max_tokens: int = 5

@app.get('/')
def hello_world():
    return {'message': 'Hello, World!'}

@app.head('/')
def hello_world_head():
    return {'message': 'Hello, World!'}

@app.post("/openai", response_model=List[ProductSuggestion])
async def get_suggestions(product_query: ProductQuery):
    try:
        if len(product_query.query.strip()) < 3:
            return []

        prompt = f"""
        Analise o seguinte produto e forneça:
        1. O código NCM mais apropriado
        2. Uma breve descrição do produto
        3. Principais atributos

        Produto: {product_query.query}

        Responda em formato estruturado, separando NCM e descrição.
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Você é um especialista em classificação NCM de produtos."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.3
        )

        content = response.choices[0].message.content

        lines = content.strip().split('\n')
        ncm = lines[0] if len(lines) > 0 else ""
        description = lines[1] if len(lines) > 1 else ""

        suggestions = [
            ProductSuggestion(
                ncm=ncm,
                description=description
            )
        ]

        return suggestions

    except openai.error.OpenAIError as e:
        print(f"Erro na API da OpenAI: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na API da OpenAI: {e}")
    except Exception as e:
        print(f"Erro ao obter sugestões: {e}")
        raise HTTPException(status_code=500, detail=f"Erro inesperado: {e}")

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host='0.0.0.0', port=port)