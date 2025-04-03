#!/usr/bin/env python3
"""
Script para testar a API de Cadastro de Atributos e salvar os resultados

Uso:
    python api_test_script.py --token "seu_token_jwt" --csrf "seu_token_csrf"

Este script faz várias requisições à API de Cadastro de Atributos e salva os resultados
em arquivos JSON e também gera um arquivo Markdown com a documentação completa.
"""

import argparse
import json
import os
import sys
import time
import requests
from datetime import datetime
from pathlib import Path
import requests_pkcs12
from dotenv import load_dotenv


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Teste da API de Cadastro de Atributos"
    )
    parser.add_argument("--token", required=True, help="Token JWT para autenticação")
    parser.add_argument(
        "--csrf", required=True, help="Token CSRF para proteção contra ataques"
    )
    parser.add_argument(
        "--base-url",
        default="https://val.portalunico.siscomex.gov.br/cadatributos/api",
        help="URL base da API (padrão: ambiente de validação)",
    )
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Diretório onde os resultados serão salvos (padrão: diretório atual)",
    )
    return parser.parse_args()


def setup_output_dir(output_dir):
    """Prepara o diretório de saída"""
    output_path = Path(output_dir)
    responses_path = output_path / "responses"

    # Criar diretório de respostas se não existir
    responses_path.mkdir(parents=True, exist_ok=True)

    return output_path, responses_path


def make_request(method, url, headers, json_data=None, params=None, output_file=None):
    """Faz uma requisição HTTP e salva a resposta"""
    print(f"Fazendo requisição {method} para {url}")

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=json_data, timeout=30)
        else:
            print(f"Método HTTP não suportado: {method}")
            return None

        # Verificar se a resposta foi bem-sucedida
        response.raise_for_status()

        # Se for uma resposta binária (ZIP), salvar como arquivo binário
        if "application/zip" in response.headers.get("Content-Type", ""):
            if output_file:
                with open(output_file, "wb") as f:
                    f.write(response.content)
                print(f"Arquivo salvo em: {output_file}")
            return {
                "type": "binary",
                "size": len(response.content),
                "filename": output_file,
            }

        # Para respostas JSON, analisar e salvar como JSON
        try:
            json_response = response.json()
            if output_file:
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(json_response, f, ensure_ascii=False, indent=2)
                print(f"Resposta JSON salva em: {output_file}")
            return json_response
        except ValueError:
            # Se não for JSON, salvar o texto da resposta
            if output_file:
                with open(output_file, "w", encoding="utf-8") as f:
                    f.write(response.text)
                print(f"Resposta de texto salva em: {output_file}")
            return response.text

    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")
        return {"error": str(e)}


def run_api_tests(args, responses_path):
    """Executa os testes de API e retorna os resultados"""
    base_url = args.base_url
    headers = {
        "Authorization": f"Bearer {args.token}",
        "X-CSRF-Token": args.csrf,
        "Content-Type": "application/json",
    }

    results = []

    # Teste 1: Consulta de NCM específico
    test1 = {
        "title": "Consulta da relação de atributos de um código NCM específico",
        "method": "GET",
        "url": f"{base_url}/ext/atributo-ncm/02011000",
        "headers": headers,
        "output_file": responses_path / "ncm_02011000.json",
    }
    test1["response"] = make_request(
        test1["method"], test1["url"], headers, output_file=test1["output_file"]
    )
    results.append(test1)

    # Teste 2: Consulta de NCM com parâmetros
    test2 = {
        "title": "Consulta de NCM com parâmetros",
        "method": "GET",
        "url": f"{base_url}/ext/atributo-ncm/84099190",
        "params": {"modalidade": "IMPORTACAO", "objetivos": "PRODUTO"},
        "headers": headers,
        "output_file": responses_path / "ncm_84099190_params.json",
    }
    test2["response"] = make_request(
        test2["method"],
        test2["url"],
        headers,
        params=test2["params"],
        output_file=test2["output_file"],
    )
    results.append(test2)

    # Teste 3: Consulta de atributos por código
    test3 = {
        "title": "Consulta de atributos por código",
        "method": "POST",
        "url": f"{base_url}/ext/atributo/consulta-codigo",
        "data": {
            "codigos": ["ATT_2386", "ATT_8836"],
            "data": datetime.now().strftime("%Y-%m-%dT00:00:00.000Z"),
        },
        "headers": headers,
        "output_file": responses_path / "atributos_por_codigo.json",
    }
    test3["response"] = make_request(
        test3["method"],
        test3["url"],
        headers,
        json_data=test3["data"],
        output_file=test3["output_file"],
    )
    results.append(test3)

    # Teste 4: Consulta de atributos por nome
    test4 = {
        "title": "Consulta de atributos por nome",
        "method": "POST",
        "url": f"{base_url}/ext/atributo/consulta-nome",
        "data": {
            "nomes": ["Potência (kW)", "Produto para crianças?"],
            "data": datetime.now().strftime("%Y-%m-%dT00:00:00.000Z"),
        },
        "headers": headers,
        "output_file": responses_path / "atributos_por_nome.json",
    }
    test4["response"] = make_request(
        test4["method"],
        test4["url"],
        headers,
        json_data=test4["data"],
        output_file=test4["output_file"],
    )
    results.append(test4)

    # Teste 5: Download de arquivo
    test5 = {
        "title": "Download do arquivo de atributos por NCM",
        "method": "GET",
        "url": f"{base_url}/ext/atributo-ncm/download/json",
        "params": {"codigosNCM": ["02011000", "84099190"]},
        "headers": headers,
        "output_file": responses_path / "atributos_ncm.zip",
    }
    test5["response"] = make_request(
        test5["method"],
        test5["url"],
        headers,
        params=test5["params"],
        output_file=test5["output_file"],
    )
    results.append(test5)

    # Aguardar um pouco entre as requisições para não sobrecarregar a API
    time.sleep(1)

    return results


def generate_markdown(results, output_path):
    """Gera a documentação markdown com os resultados"""
    md_file = output_path / "ncm_attributes_api_tests.md"

    with open(md_file, "w", encoding="utf-8") as f:
        f.write("# Testes da API de Atributos NCM\n\n")
        f.write(
            f"*Data de execução: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
        )

        for i, test in enumerate(results, 1):
            f.write(f"## {i}. {test['title']}\n\n")

            # Requisição
            f.write("### Requisição\n\n")
            f.write("```bash\n")
            if test["method"] == "GET":
                params_str = ""
                if test.get("params"):
                    params_str = "?" + "&".join(
                        [f"{k}={v}" for k, v in test["params"].items()]
                    )
                f.write(f"curl -X GET \"{test['url']}{params_str}\" \\\n")
            else:  # POST
                f.write(f"curl -X POST \"{test['url']}\" \\\n")
                f.write('  -H "Content-Type: application/json" \\\n')
                if test.get("data"):
                    f.write(f"  -d '{json.dumps(test['data'])}' \\\n")

            f.write('  -H "Authorization: Bearer ${TOKEN}" \\\n')
            f.write('  -H "X-CSRF-Token: ${CSRF_TOKEN}"\n')
            f.write("```\n\n")

            # Resposta
            f.write("### Resposta\n\n")

            if (
                isinstance(test["response"], dict)
                and test["response"].get("type") == "binary"
            ):
                f.write(
                    f"*Arquivo binário salvo em: {test['response'].get('filename')}*\n\n"
                )
                f.write(f"Tamanho: {test['response'].get('size')} bytes\n\n")
            elif isinstance(test["response"], dict) and test["response"].get("error"):
                f.write(f"*Erro: {test['response'].get('error')}*\n\n")
            else:
                f.write("```json\n")
                # Limitar a saída para não ficar muito grande
                if isinstance(test["response"], dict) or isinstance(
                    test["response"], list
                ):
                    response_json = json.dumps(
                        test["response"], ensure_ascii=False, indent=2
                    )
                    if len(response_json) > 5000:
                        f.write(
                            response_json[:5000] + "\n... (resposta truncada) ...\n"
                        )
                    else:
                        f.write(response_json)
                else:
                    f.write(str(test["response"]))
                f.write("\n```\n\n")

        # Seção de análise
        f.write("## Análise dos Resultados\n\n")
        f.write("### Estrutura dos Dados Recebidos\n\n")
        f.write("*Preencha esta seção após revisar as respostas*\n\n")

        f.write("### Observações\n\n")
        f.write("*Preencha esta seção com suas observações sobre os resultados*\n\n")

        f.write("### Próximos Passos\n\n")
        f.write("1. Definir modelo de dados para nossa implementação\n")
        f.write("2. Implementar cache para reduzir chamadas à API\n")
        f.write("3. Desenvolver validações específicas para nosso uso caso\n")

    print(f"Documentação Markdown gerada em: {md_file}")


def main():
    # Analisar argumentos da linha de comando
    args = parse_args()

    # Configurar diretórios de saída
    output_path, responses_path = setup_output_dir(args.output_dir)

    # Executar os testes de API
    results = run_api_tests(args, responses_path)

    # Gerar a documentação Markdown
    generate_markdown(results, output_path)

    print("Testes concluídos com sucesso!")


if __name__ == "__main__":
    main()
