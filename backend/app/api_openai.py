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
origins = ["http://localhost:3000", "http://localhost:8000", "http://localhost:5173", "http://localhost:10000"]
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

class ClassificacaoTributaria(BaseModel):
    monofasico: bool = Field(False, description="Indica se o produto é monofásico")
    aliquota_zero: bool = Field(False, description="Indica se o produto possui alíquota zero")
    ipi_entrada: str = Field("não tributado", description="Alíquota de IPI na entrada")
    ipi_saida: str = Field("não tributado", description="Alíquota de IPI na saída")
    pis_entrada: str = Field("não tributado", description="Alíquota de PIS na entrada")
    pis_saida: str = Field("não tributado", description="Alíquota de PIS na saída")
    cofins_entrada: str = Field("não tributado", description="Alíquota de COFINS na entrada")
    cofins_saida: str = Field("não tributado", description="Alíquota de COFINS na saída")
    cst_entrada: str = Field("sem CST", description="Código CST de entrada")
    cst_saida: str = Field("sem CST", description="Código CST de saída")

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
    classificacao_tributaria: ClassificacaoTributaria = Field(
        default=ClassificacaoTributaria(),
        description="Informações detalhadas de classificação tributária"
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
        Analise o seguinte produto e procure na tabela TIPI que foi enviada no storage "File ID: file-F9UTScsipwH3CRhJyMH8rF", em seguida retorne:
        1. Ocódigo NCM mais apropriado (com 8 dígitos) para o produto e validado com a tabela TIPI;
        2.Uma breve descrição do produto;
        3. Atributos do produto;
        4. Atributos específicos da TIPI;
        5. Classificação tributária do produto, com as seguintes informações em JSON com as chaves:
        - ncm
        - descricao
        - atributos (array)
        - atributos_tipis (array)
        - classificacao_tributaria (obj) obrigatória com:
            monofasico (bool),
            aliquota_zero (bool),
            ipi_entrada (string),
            ipi_saida (string),
            pis_entrada (string),
            pis_saida (string),
            cofins_entrada (string),
            cofins_saida (string),
            cst_entrada (string),
            cst_saida (string)
        Caso algum valor não seja aplicável, use "não tributado", "sem alíquota" ou "0%".
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
                
            ct = data.get("classificacao_tributaria", {})
            
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
                    atributos=data.get("atributos", []),
                    classificacao_tributaria=ClassificacaoTributaria(
                        monofasico=ct.get("monofasico", False),
                        aliquota_zero=ct.get("aliquota_zero", False),
                        ipi_entrada=ct.get("ipi_entrada", "não tributado"),
                        ipi_saida=ct.get("ipi_saida", "não tributado"),
                        pis_entrada=ct.get("pis_entrada", "não tributado"),
                        pis_saida=ct.get("pis_saida", "não tributado"),
                        cofins_entrada=ct.get("cofins_entrada", "não tributado"),
                        cofins_saida=ct.get("cofins_saida", "não tributado"),
                        cst_entrada=ct.get("cst_entrada", "sem CST"),
                        cst_saida=ct.get("cst_saida", "sem CST"),
                    )
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