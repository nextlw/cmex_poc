from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from ..config import settings, MODEL_MAPPING, ERROR_MESSAGES
from ..models.schemas import (
    ConsultaProduto,
    SugerirNCM,
    ValoresdeImpostos,
    ClassificacaoTributaria
)
import time
import logging
import json
from line_profiler import LineProfiler, profile
import sys

gemini_router = APIRouter()

@profile
def converter_para_booleano(valor):
    return str(valor).lower() in ['sim', 'true', '1', 'verdadeiro']

@gemini_router.post("/gemini")
@profile
async def obter_sugestoes_gemini(consulta_produto: ConsultaProduto):
    # Crie o LineProfiler antes do processamento
    profiler = LineProfiler()
    
    try:
        # Adicione as funções que você quer perfilar
        profiler.add_function(json.loads)
        profiler.add_function(converter_para_booleano)
        profiler.add_function(obter_sugestoes_gemini)
        
        # Ative o profiler
        profiler.enable()
        
        start_time = time.time()
        
        # Verifique se a chave da API do Gemini foi configurada
        if not settings.GOOGLE_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail=ERROR_MESSAGES["api_key_missing"]
            )
        
        # Tempo para verificar a chave da API
        api_key_check_time = time.time() - start_time
        logging.info(f"Tempo para verificar API Key: {api_key_check_time} segundos")
        
        model_config = MODEL_MAPPING["Gemini-1.5-pro"]
        
        # Configurar a API key do Google
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        logging.info(f"Recebendo consulta Gemini: {consulta_produto.consulta}")
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
            
            Retorne APENAS um JSON, **SEM** texto adicional, no seguinte formato:

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
        """

        logging.info("Enviando prompt para Gemini")
        logging.debug(f"Prompt enviado para Gemini: {prompt}")

        # Chamada à API do Gemini
        # Tempo para chamada da API Gemini
        start_gemini_call = time.time()
        gemini = genai.GenerativeModel(model_name=model_config["model_name"])
        response = gemini.generate_content(
            prompt,
            generation_config={
                "temperature": model_config["temperature"],
                "max_output_tokens": model_config["max_tokens"]
            },
            safety_settings={},
            stream=False
        )
        gemini_call_time = time.time() - start_gemini_call
        logging.info(f"Tempo para chamada Gemini: {gemini_call_time} segundos")

        # Extrai o conteúdo da resposta
        content = response.text.replace("```json", "").replace("```", "").strip()
        logging.info(f"Resposta do Gemini: {content}")

        # Verificação do comprimento da resposta
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
                        atributos_tipi=atributos_tipi,
                        classificacao_tributaria=ClassificacaoTributaria(
                            monofasico=converter_para_booleano(item.get("classificacao_tributaria", {}).get("monofasico", False)),
                            aliquota_zero=converter_para_booleano(item.get("classificacao_tributaria", {}).get("aliquota_zero", False)),
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
                
            resultado = [sugestao.to_frontend_format() for sugestao in sugestoes]
            
            # Desative o profiler
            profiler.disable()
            
            # Capturar saída do perfil
            output = sys.stdout
            profiler.print_stats(output)
            
            return resultado
        
        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar JSON: {e}\nConteúdo recebido: {content}")
            return []

    except Exception as e:
        # Log de erro
        logging.error(f"Erro no processamento: {str(e)}")
        
        # Desative o profiler em caso de erro
        profiler.disable()
        raise

# Função: Executa perfil de desempenho separadamente
def run_profile():
    # Cria consulta de exemplo e roda perfil
    consulta = ConsultaProduto(
        consulta="Exemplo de produto para perfil",
        estadoOrigem="SP",
        operacao="Venda",
        regimeTributario="Simples Nacional"
    )

    # Crie o profiler
    profiler = LineProfiler(obter_sugestoes_gemini)
    
    # Execute a função com o profiler
    with profiler:
        resultado = obter_sugestoes_gemini(consulta)
    
    # Imprima as estatísticas
    profiler.print_stats()

# Função: Ponto de entrada para execução do perfil
if __name__ == "__main__":
    run_profile()