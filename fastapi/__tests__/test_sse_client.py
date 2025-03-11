#!/usr/bin/env python3
"""
Script para testar o middleware de formatação de mensagens SSE.
Este script se conecta ao endpoint de teste SSE e imprime as mensagens recebidas.

Uso:
python test_sse_client.py
"""

import requests
import json
import sys
from sseclient import SSEClient

# URL do endpoint de teste
TEST_URL = "http://localhost:10000/api/test/test-sse-formatter"

def colorize(text, color_code):
    """Adiciona cor ao texto para melhor visualização no terminal."""
    return f"\033[{color_code}m{text}\033[0m"

def print_colored_json(obj, indent=2):
    """Imprime JSON colorido e formatado."""
    formatted = json.dumps(obj, indent=indent, ensure_ascii=False)
    # Substituir chaves, colchetes e aspas por versões coloridas
    formatted = formatted.replace('{', colorize('{', '1;36')).replace('}', colorize('}', '1;36'))
    formatted = formatted.replace('[', colorize('[', '1;36')).replace(']', colorize(']', '1;36'))
    formatted = formatted.replace('"', colorize('"', '1;33'))
    
    # Colorir os valores numéricos
    import re
    formatted = re.sub(r'(\d+)', colorize(r'\1', '1;35'), formatted)
    
    print(formatted)

def main():
    """Função principal que se conecta ao SSE e processa os eventos."""
    print(colorize("Conectando ao endpoint de teste SSE...", "1;32"))
    print(colorize(f"URL: {TEST_URL}", "1;34"))
    print()
    
    try:
        # Primeiro, vamos verificar se o endpoint está acessível
        print(colorize("Verificando se o endpoint está acessível...", "1;33"))
        response = requests.get(TEST_URL)
        
        # Se não for 200, pode ser um erro de autenticação ou outro problema
        if response.status_code != 200:
            print(colorize(f"Erro ao acessar o endpoint. Status code: {response.status_code}", "1;31"))
            print(colorize("Resposta do servidor:", "1;31"))
            try:
                print_colored_json(response.json())
            except:
                print(response.text)
            sys.exit(1)
        
        print(colorize("Endpoint acessível! Conectando ao stream SSE...", "1;32"))
        
        # Conectar ao endpoint SSE
        messages = SSEClient(TEST_URL)
        
        # Processar cada evento recebido
        for event in messages.events():
            event_type = event.event or "message"
            print(colorize(f"\n=== Evento: {event_type} ===", "1;32"))
            
            try:
                # Tentar parsear o JSON da mensagem
                data = json.loads(event.data)
                print_colored_json(data)
            except json.JSONDecodeError:
                # Se não for JSON válido, imprimir como texto
                print(colorize("Dados não-JSON:", "1;31"))
                print(event.data)
                
    except requests.exceptions.RequestException as e:
        print(colorize(f"Erro de conexão: {e}", "1;31"))
        sys.exit(1)
    except KeyboardInterrupt:
        print(colorize("\nConexão interrompida pelo usuário.", "1;33"))
    except Exception as e:
        print(colorize(f"Erro inesperado: {e}", "1;31"))
        print(colorize(f"Tipo de erro: {type(e)}", "1;31"))
        print(colorize(f"Detalhes: {str(e)}", "1;31"))
        import traceback
        print(colorize("Traceback:", "1;31"))
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 