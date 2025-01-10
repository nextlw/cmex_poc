from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    ConsultaProduto,
    SugerirNCM,
    ValoresdeImpostos,
    ClassificacaoTributaria
)
import logging
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
# Configurar a API key do Google
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise HTTPException(status_code=500, detail="GOOGLE_API_KEY não configurada no ambiente")

genai.configure(api_key=GOOGLE_API_KEY)

gemini_router = APIRouter()

@gemini_router.post("/gemini")
async def obter_sugestoes_gemini(consulta_produto: ConsultaProduto):
    """
    Endpoint para consultar o Gemini e retornar um ou mais objetos SugestaoProduto.
    """
    try:
        logging.info(f"Recebendo consulta: {consulta_produto.consulta}")
        texto = consulta_produto.consulta.strip()
        if len(texto) < 3:
            return []

        # Monta o prompt para o modelo
        prompt = f"""
            Você é um especialista em classificação NCM e tributação de produtos.
            Analise o seguinte produto e procure na tabela TIPI.
            Produto: {consulta_produto.consulta}
                Estado de origem: {consulta_produto.estadoOrigem or 'Não informado'}
                Operação: {consulta_produto.operacao or 'Não informado'}
                Regime tributário: {consulta_produto.regimeTributario or 'Não informado'}
                Tributação: {consulta_produto.tributacao or 'Não informado'}
                Reduções ou isenções locais: {consulta_produto.reducaoOuIsencao or 'Não informado'}
            Em seguida, retorne APENAS um JSON, **SEM** texto adicional, no seguinte formato:

            {{
            "ncm": "XX.XX.XX.XX",
            "descricao": "Uma breve descrição do produto com base nas características da ncm encontrada",
            "atributos": ["...cada atributo deve ter como foco o produto que será cadastrado na duimp no novo sistema do governo CISCOMEX"],
            "atributos_tipi": ["...cada atributo deve der retirado do que tem daquela ncm na tabela tipi 2024"],
            "valores_de_impostos": {{
            "ipi": "valor real do IPI",
            "icms": {{"estado": "valor real do ICMS"}},
            "pis": "valor real do PIS",
            "cofins": "valor real do COFINS"
            }},
            "classificacao_tributaria": {{
            "monofasico": valor real,
            "aliquota_zero": valor real,
            "ipi_entrada": "valor real do IPI na entrada",
            "ipi_saida": "valor real do IPI na saída",
            "pis_entrada": "valor real do PIS na entrada",
            "pis_saida": "valor real do PIS na saída",
            "cofins_entrada": "valor real do COFINS na entrada",
            "cofins_saida": "valor real do COFINS na saída",
            "cst_entrada": "valor real do CST de entrada",
            "cst_saida": "valor real do CST de saída"
            }}
            }}

            **Importante**:
            - Não retorne nada além desse JSON.
            - em "classificacao_tributaria", coloque as aliquotas em porcentagem quando tiver, quando não informe o porque não tem com no máximo 2 palavras.

            Produto: {texto}
        """

        logging.info("Enviando prompt para Gemini")

        # Chamar o modelo Gemini
        gemini = genai.GenerativeModel(model_name="gemini-1.5-pro")
        response = gemini.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,     # ou 0.1 para reduzir ao máximo a "criatividade"
                "max_output_tokens": 500
            },
            safety_settings={},
            stream=False
        )

        content = response.text
        content = content.replace("```json", "").replace("```", "").strip()

        data = json.loads(content)
        logging.info(f"Resposta do Gemini: {content}")

        # Tentar fazer parse da string JSON
        try:
            data = json.loads(content)

            # Se não vier lista, transformamos em lista
            if not isinstance(data, list):
                data = [data]

            sugestoes = []
            for item in data:
                # Captura as chaves que vêm do modelo
                atributos = item.get("atributos", [])
                atributos_tipi = item.get("atributos_tipi", [])
                descricao = item.get("descricao", "")

                # Criar objeto SugerirNCM com nomes coerentes ao front-end
                sugestoes.append(
                    SugerirNCM(
                        ncm=item.get("ncm", ""),
                        descricao=descricao,
                        atributos=atributos,
                        valores_de_impostos=ValoresdeImpostos(
                            ipi=item.get("valores_de_impostos", {}).get("ipi", "0%"),
                            icms=item.get("valores_de_impostos", {}).get("icms", {}),
                            pis=item.get("valores_de_impostos", {}).get("pis", "1.65%"),
                            cofins=item.get("valores_de_impostos", {}).get("cofins", "7.6%")
                        ),
                        # Note que o "tipi_attributes" do JSON vai popular o "atributos_tipi"
                        # por causa do validation_alias
                        atributos_tipi=atributos_tipi,
                        classificacao_tributaria=ClassificacaoTributaria(
                            monofasico=item.get("classificacao_tributaria", {}).get("monofasico", False),
                            aliquota_zero=item.get("classificacao_tributaria", {}).get("aliquota_zero", False),
                            ipi_entrada=item.get("classificacao_tributaria", {}).get("ipi_entrada"),
                            ipi_saida=item.get("classificacao_tributaria", {}).get("ipi_saida"),
                            pis_entrada=item.get("classificacao_tributaria", {}).get("pis_entrada"),
                            pis_saida=item.get("classificacao_tributaria", {}).get("pis_saida"),
                            cofins_entrada=item.get("classificacao_tributaria", {}).get("cofins_entrada"),
                            cofins_saida=item.get("classificacao_tributaria", {}).get("cofins_saida"),
                            cst_entrada=item.get("classificacao_tributaria", {}).get("cst_entrada"),
                            cst_saida=item.get("classificacao_tributaria", {}).get("cst_saida")
                        )
                    )
                )

            logging.info(f"Lista parseada com sucesso: {sugestoes}")
            print(f"Resposta recebida: {sugestoes}")

            # Loga cada sugestão para debug
            for sugestao in sugestoes:
                logging.debug(f"Estrutura da sugestão: {sugestao.dict()}")

            # Converte cada sugestão para formato de frontend
            return [sugestao.to_frontend_format() for sugestao in sugestoes]

        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar JSON: {e}\nConteúdo recebido: {content}")
            return []

    except Exception as e:
        logging.error(f"Erro inesperado: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))