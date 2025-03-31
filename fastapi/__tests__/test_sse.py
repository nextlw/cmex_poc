#!/usr/bin/env python3
"""
Teste para o middleware de formatação de mensagens SSE.
Este script realiza testes de integração para o middleware MessageFormatter.

Execução:
python -m tests.test_sse
"""

import pytest
import asyncio
import json
import sys
import os
import requests
from sseclient import SSEClient

# Configurações de teste
BASE_URL = "http://localhost:10000"
TEST_ENDPOINTS = [
    "/api/test/test-sse-formatter",
    "/api/test/test-sse-simple",
    "/api/test/test-json"
]

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

def test_json_endpoint():
    """Testa o endpoint JSON simples."""
    print(colorize("\n=== Testando endpoint JSON ===", "1;32"))
    url = f"{BASE_URL}/api/test/test-json"
    
    try:
        response = requests.get(url)
        assert response.status_code == 200, f"Erro: status code {response.status_code}"
        
        data = response.json()
        print_colored_json(data)
        
        assert "mensagem" in data, "Mensagem não encontrada na resposta"
        assert "status" in data, "Status não encontrado na resposta"
        assert data["status"] == "ok", "Status não é 'ok'"
        
        print(colorize("✓ Teste do endpoint JSON bem-sucedido!", "1;32"))
        return True
    except Exception as e:
        print(colorize(f"✗ Erro no teste do endpoint JSON: {str(e)}", "1;31"))
        return False

def test_sse_endpoint(endpoint):
    """Testa um endpoint SSE específico."""
    print(colorize(f"\n=== Testando endpoint SSE: {endpoint} ===", "1;32"))
    url = f"{BASE_URL}{endpoint}"
    
    try:
        # Primeiro verifica se o endpoint está acessível
        print(colorize("Verificando se o endpoint está acessível...", "1;33"))
        response = requests.get(url)
        
        # Para endpoint SSE, espera-se um status 200
        if response.status_code != 200:
            print(colorize(f"✗ Erro ao acessar o endpoint. Status code: {response.status_code}", "1;31"))
            try:
                print_colored_json(response.json())
            except:
                print(response.text)
            return False
        
        print(colorize("Endpoint acessível! Conectando ao stream SSE...", "1;32"))
        
        # Sem timeout específico - usará o timeout padrão
        messages = SSEClient(url)
        
        # Processa apenas os primeiros eventos para não bloquear o teste
        event_count = 0
        max_events = 3  # Limita o número de eventos a processar
        
        for event in messages.events():
            event_count += 1
            event_type = event.event or "message"
            print(colorize(f"\n=== Evento {event_count}: {event_type} ===", "1;32"))
            
            try:
                # Tenta parsear o JSON da mensagem
                data = json.loads(event.data)
                print_colored_json(data)
                
                # Verifica a estrutura da mensagem formatada
                if "type" in data:
                    assert data["type"] in ["answer", "reflect", "search", "visit", "progress", "error", "thinking", "message"], \
                        f"Tipo de mensagem inválido: {data['type']}"
                    
                    assert "content" in data, "Campo 'content' não encontrado na mensagem"
                    assert "data" in data, "Campo 'data' não encontrado na mensagem"
            except json.JSONDecodeError:
                print(colorize("Dados não-JSON:", "1;31"))
                print(event.data)
            
            # Limita o número de eventos a processar
            if event_count >= max_events:
                print(colorize(f"Limite de {max_events} eventos atingido. Interrompendo teste.", "1;33"))
                break
        
        # Se não recebeu nenhum evento, considera falha
        if event_count == 0:
            print(colorize("✗ Não foram recebidos eventos SSE.", "1;31"))
            return False
            
        print(colorize(f"✓ Teste do endpoint SSE {endpoint} bem-sucedido! ({event_count} eventos recebidos)", "1;32"))
        return True
    except requests.exceptions.RequestException as e:
        print(colorize(f"✗ Erro de conexão: {e}", "1;31"))
        return False
    except Exception as e:
        print(colorize(f"✗ Erro inesperado: {e}", "1;31"))
        import traceback
        traceback.print_exc()
        return False

def run_tests():
    """Executa todos os testes."""
    print(colorize("Iniciando testes do middleware de formatação SSE...", "1;34"))
    
    # Testa o endpoint JSON primeiro (mais simples)
    json_result = test_json_endpoint()
    
    # Testa os endpoints SSE
    sse_results = []
    for endpoint in TEST_ENDPOINTS:
        if "json" not in endpoint:  # Pula o endpoint JSON que já foi testado
            result = test_sse_endpoint(endpoint)
            sse_results.append((endpoint, result))
    
    # Exibe o resumo dos testes
    print(colorize("\n=== Resumo dos Testes ===", "1;34"))
    print(colorize(f"Endpoint JSON: {'✓' if json_result else '✗'}", "1;32" if json_result else "1;31"))
    
    all_passed = json_result and all(result for _, result in sse_results)
    for endpoint, result in sse_results:
        print(colorize(f"Endpoint {endpoint}: {'✓' if result else '✗'}", "1;32" if result else "1;31"))
    
    # Resultado final
    if all_passed:
        print(colorize("\nTodos os testes passaram com sucesso! 🎉", "1;32"))
        return 0
    else:
        print(colorize("\nAlguns testes falharam. 😢", "1;31"))
        return 1

if __name__ == "__main__":
    sys.exit(run_tests()) 