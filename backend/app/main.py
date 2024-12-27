from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import openai
import os
import logging

# Inicialização do aplicativo FastAPI
app = FastAPI()

# Configuração da chave de API da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise HTTPException(status_code=500, detail="A chave de API da OpenAI não está definida.")

# Configuração de CORS para permitir requisições do frontend
origins = ["http://localhost:3000", "http://localhost:8000", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Altere para o domínio do seu frontend em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Definição dos modelos de dados usando Pydantic
class ConsultaProduto(BaseModel):
    consulta: str = Field(..., min_length=1, description="Texto de busca do produto")

class SugestaoProduto(BaseModel):
    ncm: str = Field(..., description="Código NCM do produto")
    descricao: str = Field(..., description="Descrição do produto")
    atributos: List[str] = Field(default=[], description="Lista de atributos do produto")
    aliquotas: dict = Field(
        default={
            "ipi": "0% ou isento ou monofásico",
            "icms": {},
            "pis": "1.65% ou 0% ou monofásico",
            "cofins": "7.6% ou 0% ou monofásico"
        },
        description="Alíquotas tributárias do produto (considerando isenção, monofásico, alíquota zero etc.)"
    )
    atributos_tipis: List[str] = Field(
        default=[],
        description="Atributos específicos da TIPI"
    )

class RespostaProduto(BaseModel):
    sugestoes: List[SugestaoProduto]

class RespostaErro(BaseModel):
    detalhe: str = Field(..., description="Mensagem de erro")

class VerificacaoSaude(BaseModel):
    status: str = Field(..., description="Status da API")

class RequisicaoOpenAI(BaseModel):
    prompt: str
    max_tokens: int = 5

# Rota de verificação de saúde da API
@app.get('/')
def ola_mundo():
    return {'message': 'Olá, Mundo!'}

# Rota de verificação de saúde da API usando HEAD
@app.head('/')
def ola_mundo_head():
    return {'message': 'Olá, Mundo!'}

# Rota para obter sugestões de produtos usando a API da OpenAI
@app.post("/openai", response_model=List[SugestaoProduto])
async def obter_sugestoes(consulta_produto: ConsultaProduto):
    try:
        logging.debug(f"Recebido consulta: {consulta_produto.consulta}")

        # Verificação do comprimento da consulta
        if len(consulta_produto.consulta.strip()) < 3:
            return []

        # Construção do prompt para a API da OpenAI
        prompt = f"""
        Analise o seguinte produto e procure na Tabela TIPI que foi enviada ao agente. Em seguida, forneça:
        1. O código NCM mais apropriado (com base na TIPI)
        2. Uma breve descrição do produto
        3. Alíquotas tributárias (IPI, ICMS para cada estado, PIS e COFINS)
        4. Atributos específicos da TIPI
        5. Características relevantes do produto

        Produto: {consulta_produto.consulta}
        """

        logging.debug(f"Prompt enviado para OpenAI: {prompt}")

        # Chamada à API da OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Você é um especialista em classificação NCM e tributação de produtos."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.2
        )

        content = response.choices[0].message.content
        logging.debug(f"Resposta da OpenAI: {content}")
        
        # Processamento da resposta JSON
        try:
            import json
            data = json.loads(content)
            aliquotas = data.get("aliquotas", {})
            
            # Garantir que temos um objeto ICMS válido
            if not isinstance(aliquotas.get("icms"), dict):
                aliquotas["icms"] = {}
                
            sugestoes = [
                SugestaoProduto(
                    ncm=data.get("ncm", ""),
                    descricao=data.get("descricao", ""),
                    aliquotas={
                        "ipi": aliquotas.get("ipi", "0%"),
                        "icms": aliquotas.get("icms", {}),
                        "pis": aliquotas.get("pis", "1.65%"),
                        "cofins": aliquotas.get("cofins", "7.6%")
                    },
                    atributos_tipis=data.get("atributos_tipis", []),
                    atributos=data.get("atributos", [])
                )
            ]
        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar JSON: {e}")
            # Fallback para o formato anterior
            lines = content.strip().split('\n')
            sugestoes = [
                SugestaoProduto(
                    ncm=lines[0] if len(lines) > 0 else "",
                    descricao=lines[1] if len(lines) > 1 else "",
                )
            ]

        return sugestoes

    except openai.error.OpenAIError as e:
        logging.error(f"Erro na API da OpenAI: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na API da OpenAI: {e}")
    except Exception as e:
        logging.error(f"Erro ao obter sugestões: {e}")
        raise HTTPException(status_code=500, detail=f"Erro inesperado: {e}")

# Inicialização do servidor Uvicorn
if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host='0.0.0.0', port=port)