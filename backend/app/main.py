from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import openai
import os
import logging

app = FastAPI()

# Configuração da chave de API da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise HTTPException(status_code=500, detail="A chave de API da OpenAI não está definida.")

origins = ["http://localhost:3000", "http://localhost:8000", "http://localhost:5173"]  # Adicione http://localhost:5173 às origens permitidas
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
    attributes: List[str] = Field(default=[], description="Lista de atributos do produto")
    tax_rates: dict = Field(
        default={
            "ipi": "0%",
            "icms": {},
            "pis": "1.65%",
            "cofins": "7.6%"
        },
        description="Alíquotas tributárias do produto"
    )
    tipi_attributes: List[str] = Field(
        default=[],
        description="Atributos específicos da TIPI"
    )

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
        logging.debug(f"Recebido query: {product_query.query}")

        if len(product_query.query.strip()) < 3:
            return []

        prompt = f"""
        Analise o seguinte produto e forneça:
        1. O código NCM mais apropriado
        2. Uma breve descrição do produto
        3. Alíquotas tributárias:
           - IPI
           - ICMS para cada estado
           - PIS
           - COFINS
        4. Atributos específicos da TIPI
        5. Características relevantes do produto

        Produto: {product_query.query}

        Responda em formato estruturado JSON, contendo:
        - ncm: código NCM
        - description: descrição do produto
        - tax_rates: objeto com as alíquotas, onde icms deve ser um objeto com os estados
        - tipi_attributes: lista de atributos da TIPI
        - attributes: lista de características
        
        Exemplo do formato esperado para tax_rates:
        {{
          "ipi": "5%",
          "icms": {{
            "SP": "18%",
            "RJ": "20%",
            "MG": "18%",
            ...
          }},
          "pis": "1.65%",
          "cofins": "7.6%"
        }}
        """

        logging.debug(f"Prompt enviado para OpenAI: {prompt}")

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Você é um especialista em classificação NCM e tributação de produtos."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3
        )

        content = response.choices[0].message.content
        logging.debug(f"Resposta da OpenAI: {content}")
        
        # Processar a resposta JSON
        try:
            import json
            data = json.loads(content)
            tax_rates = data.get("tax_rates", {})
            
            # Garantir que temos um objeto ICMS válido
            if not isinstance(tax_rates.get("icms"), dict):
                tax_rates["icms"] = {}
                
            suggestions = [
                ProductSuggestion(
                    ncm=data.get("ncm", ""),
                    description=data.get("description", ""),
                    tax_rates={
                        "ipi": tax_rates.get("ipi", "0%"),
                        "icms": tax_rates.get("icms", {}),
                        "pis": tax_rates.get("pis", "1.65%"),
                        "cofins": tax_rates.get("cofins", "7.6%")
                    },
                    tipi_attributes=data.get("tipi_attributes", []),
                    attributes=data.get("attributes", []),
                    value=data.get("value", "0%") # Se a propriedade value for necessária
                )
            ]
        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar JSON: {e}")
            # Fallback para o formato anterior
            lines = content.strip().split('\n')
            suggestions = [
                ProductSuggestion(
                    ncm=lines[0] if len(lines) > 0 else "",
                    description=lines[1] if len(lines) > 1 else "",
                )
            ]

        return suggestions

    except openai.error.OpenAIError as e:
        logging.error(f"Erro na API da OpenAI: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na API da OpenAI: {e}")
    except Exception as e:
        logging.error(f"Erro ao obter sugestões: {e}")
        raise HTTPException(status_code=500, detail=f"Erro inesperado: {e}")

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host='0.0.0.0', port=port)