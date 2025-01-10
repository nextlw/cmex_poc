# Bibliotecas
import logging, openai, json
from flask import Blueprint, jsonify, request, g
from ..schemas.queries.consulta_produto import ConsultaProduto
from ..schemas.queries.sugestao_produto import SugestaoProduto
from ..schemas.Erro import Erro, ErrorDetail
from pydantic import ValidationError
from .. import OPEN_AI_KEY, LIMITER

# TODO: deletar
from requests.models import Response

# Cria a blueprint
queries = Blueprint("queries", __name__)

# Configuração da chave de API da OpenAI
openai.api_key = OPEN_AI_KEY


# /api/queries
@queries.route("/", methods=["GET", "POST"])
@LIMITER.limit("25 per minute")
def index():

    # Pega o ID do usuário
    user_id = g.user.id

    # Separa o fluxo das requisições
    if request.method == "POST":

        logging.debug(
            f"queries.py :: @queries.route('/') :: index :: request :: {request}"
        )

        # Verificar se o Content-Type é application/json
        if not request.headers.get("Content-Type") == "application/json":

            # Monta o retorno do erro
            error = Erro(
                status_code=400,
                errors=[
                    ErrorDetail(
                        loc=["headers", "Content-Type"],
                        msg="O Content-Type precisa ser 'application/json'",
                        type="header_error.invalid_content_type",
                        ctx={"valor_esperado": "application/json"},
                    )
                ],
                message="Content-Type inválido",
            )
            return jsonify(error.model_dump()), error.status_code

        try:

            # Valida o JSON contra o schema
            consulta_produto = ConsultaProduto(**request.json)

            # TODO: GET /products
            produto = Response()
            produto.status_code = 500
            produto._content = b'{ "ncm" : "a", "descricao" : "b" }'

            # Retorna o produto se ele já existir no banco de dados
            if produto.ok:
                return jsonify([SugestaoProduto(**produto.json()).model_dump()]), 200

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

                Produto: {consulta_produto.consulta}

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

            logging.debug(
                f"queries.py :: @queries.route('/') :: index :: prompt :: {prompt}"
            )

            # Roda o prompt na OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Você é um especialista em classificação NCM e tributação de produtos."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )

            # Processa o conteúdo
            content = response.choices[0].message.content

            logging.debug(
                f"queries.py :: @queries.route('/') :: index :: prompt :: {content}"
            )
            
            # Processar a resposta JSON
            try:

                # Carrega o conteúdo em um JSON
                data = json.loads(content)
                tax_rates = data.get("tax_rates", {})
                
                # Garantir que temos um objeto ICMS válido
                if not isinstance(tax_rates.get("icms"), dict):
                    tax_rates["icms"] = {}
                    
                # Monta e retorna a lista de sugestões
                sugestoes_produtos = [
                    SugestaoProduto(
                        ncm=data.get("ncm", ""),
                        description=data.get("description", ""),
                        attributes=data.get("attributes", []),
                        tax_rates={
                            "ipi": tax_rates.get("ipi", "0%"),
                            "icms": tax_rates.get("icms", {}),
                            "pis": tax_rates.get("pis", "1.65%"),
                            "cofins": tax_rates.get("cofins", "7.6%")
                        },
                        tipi_attributes=data.get("tipi_attributes", []),
                    )
                ]
                
            except json.JSONDecodeError as e:

                # Fallback para o formato anterior
                lines = content.strip().split('\n')
                sugestoes_produtos = [
                    SugestaoProduto(
                        ncm=lines[0] if len(lines) > 0 else "",
                        description=lines[1] if len(lines) > 1 else "",
                    )
                ]
                
            # TODO: POST /products
            response = Response()
            response.status_code = 500
            response._content = b'{ "key" : "a" }'

            # Verifica se o produto foi salvo no banco de dados
            if response.ok:
                return jsonify({}), 201
            
            # Converte os objetos SugestaoProduto para dicionários e retorna como JSON
            else:
                return jsonify([produto.model_dump() for produto in sugestoes_produtos]), 200

        except ValidationError as e:

            # Monta o retorno do erro
            error = Erro(
                status_code=422,
                errors=e.errors(),
                message="Consulta de produto inválida.",
            )
            return jsonify(error.model_dump()), error.status_code
        
        except openai.error.OpenAIError as e:
            
            # Monta o retorno do erro
            error = Erro(
                status_code=500,
                errors=e.errors(),
                message="Erro na API da OpenAI.",
            )
            return jsonify(error.model_dump()), error.status_code

    elif request.method == "GET":
        return jsonify({"message": f"GET :)"}), 200