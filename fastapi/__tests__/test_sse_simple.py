#!/usr/bin/env python3
"""
Teste simplificado para endpoints SSE usando requests diretamente.
Não usa sseclient para evitar problemas de compatibilidade.
"""

import requests
import json
import sys
import time

# Configurações de teste
BASE_URL = "http://localhost:10000"
TEST_ENDPOINT = "/api/test/test-json"

def colorize(text, color_code):
    """Adiciona cor ao texto para melhor visualização no terminal."""
    return f"\033[{color_code}m{text}\033[0m"

def main():
    """Função principal que testa o endpoint JSON e SSE."""
    print(colorize("=== Iniciando testes simples ===", "1;34"))
    
    # Testar o endpoint JSON
    print(colorize("\n=== Testando endpoint JSON ===", "1;32"))
    url = f"{BASE_URL}{TEST_ENDPOINT}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print(colorize(f"✓ Endpoint JSON respondeu com status 200", "1;32"))
            print(colorize("Resposta:", "1;36"))
            print(json.dumps(response.json(), indent=2))
        else:
            print(colorize(f"✗ Endpoint JSON falhou com status {response.status_code}", "1;31"))
            print(response.text)
    except Exception as e:
        print(colorize(f"✗ Erro ao testar endpoint JSON: {e}", "1;31"))
    
    # Testar o endpoint SSE de forma básica
    # Não processamos o stream completo, apenas verificamos os cabeçalhos e o início da resposta
    print(colorize("\n=== Testando endpoint SSE básico ===", "1;32"))
    sse_url = f"{BASE_URL}/api/test/test-sse-simple"
    
    try:
        # Stream=True para manter a conexão aberta
        response = requests.get(sse_url, stream=True)
        
        if response.status_code == 200:
            print(colorize(f"✓ Endpoint SSE respondeu com status 200", "1;32"))
            print(colorize("Headers:", "1;36"))
            for header, value in response.headers.items():
                print(f"{header}: {value}")
            
            print(colorize("\nPrimeiros bytes da resposta:", "1;36"))
            # Ler apenas os primeiros bytes para ver se está vindo algo
            start_time = time.time()
            timeout = 5  # segundos
            
            for line in response.iter_lines():
                if line:
                    try:
                        # Tenta decodificar a linha
                        decoded_line = line.decode('utf-8')
                        print(f"Recebido: {decoded_line}")
                    except UnicodeDecodeError:
                        print(f"Recebido (bytes): {line}")
                
                # Limita o tempo de leitura
                if time.time() - start_time > timeout:
                    print(colorize(f"Timeout após {timeout} segundos", "1;33"))
                    break
                    
            print(colorize("✓ Teste básico de SSE concluído", "1;32"))
        else:
            print(colorize(f"✗ Endpoint SSE falhou com status {response.status_code}", "1;31"))
            print(response.text)
            
    except Exception as e:
        print(colorize(f"✗ Erro ao testar endpoint SSE: {e}", "1;31"))
        import traceback
        traceback.print_exc()
    
    # Testar o endpoint SSE formatado
    print(colorize("\n=== Testando endpoint SSE formatado ===", "1;32"))
    formatter_url = f"{BASE_URL}/api/test/test-sse-formatter"
    
    try:
        # Stream=True para manter a conexão aberta
        response = requests.get(formatter_url, stream=True)
        
        if response.status_code == 200:
            print(colorize(f"✓ Endpoint SSE formatado respondeu com status 200", "1;32"))
            print(colorize("Headers:", "1;36"))
            for header, value in response.headers.items():
                print(f"{header}: {value}")
            
            print(colorize("\nPrimeiros eventos formatados:", "1;36"))
            # Ler apenas os primeiros bytes para ver se está vindo algo
            start_time = time.time()
            timeout = 10  # segundos
            
            # Variáveis para processar o evento SSE
            event_type = None
            data = ""
            event_count = 0
            max_events = 3
            
            for line in response.iter_lines():
                if line:
                    try:
                        # Tenta decodificar a linha
                        decoded_line = line.decode('utf-8')
                        
                        # Processa linhas de evento SSE
                        if decoded_line.startswith("event:"):
                            event_type = decoded_line[6:].strip()
                        elif decoded_line.startswith("data:"):
                            data = decoded_line[5:].strip()
                            
                            # Se temos tipo e dados, é um evento completo
                            if event_type and data:
                                event_count += 1
                                print(colorize(f"\n--- Evento {event_count}: {event_type} ---", "1;33"))
                                
                                # Tenta parsear o JSON
                                try:
                                    json_data = json.loads(data)
                                    print(json.dumps(json_data, indent=2))
                                    
                                    # Verifica se o formato está correto
                                    if "type" in json_data and "content" in json_data and "data" in json_data:
                                        print(colorize("✓ Formato correto (type, content, data)", "1;32"))
                                    else:
                                        print(colorize("✗ Formato incorreto", "1;31"))
                                except json.JSONDecodeError:
                                    print(f"Dados não-JSON: {data}")
                                
                                # Limpa para o próximo evento
                                event_type = None
                                data = ""
                                
                                # Limita o número de eventos
                                if event_count >= max_events:
                                    print(colorize(f"Limite de {max_events} eventos atingido", "1;33"))
                                    break
                        else:
                            print(f"Linha: {decoded_line}")
                    except UnicodeDecodeError:
                        print(f"Recebido (bytes): {line}")
                
                # Limita o tempo de leitura
                if time.time() - start_time > timeout:
                    print(colorize(f"Timeout após {timeout} segundos", "1;33"))
                    break
                    
            if event_count > 0:
                print(colorize(f"✓ Teste de SSE formatado concluído ({event_count} eventos recebidos)", "1;32"))
            else:
                print(colorize("✗ Nenhum evento recebido", "1;31"))
        else:
            print(colorize(f"✗ Endpoint SSE formatado falhou com status {response.status_code}", "1;31"))
            print(response.text)
            
    except Exception as e:
        print(colorize(f"✗ Erro ao testar endpoint SSE formatado: {e}", "1;31"))
        import traceback
        traceback.print_exc()
    
    print(colorize("\n=== Testes concluídos ===", "1;34"))

if __name__ == "__main__":
    main() 