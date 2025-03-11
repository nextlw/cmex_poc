import pytest
import time
import json
import statistics
import sys
import csv
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient

# Adicionar diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent))

from main import app
from routers.ncm_validation import ValidationRequest, AnalysisData

# Cliente de teste
client = TestClient(app)

# Configurações
TEST_CONFIG = {
    "num_requests_sequential": 100,  # Número de requisições sequenciais
    "num_requests_concurrent": 20,   # Número de requisições concorrentes
    "max_workers": 10,               # Número máximo de workers para testes concorrentes
    "log_every_n": 10                # Log a cada N requisições
}

# Diretório para resultados
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# Dados de amostra para teste
SAMPLE_REQUESTS = [
    {
        "name": "request_simple",
        "query": "Como classificar um liquidificador elétrico doméstico?",
        "analysis": {
            "relevantResults": [
                {
                    "title": "NCM 8509.40.10 - Liquidificadores",
                    "description": "Liquidificadores com motor elétrico incorporado, de uso doméstico",
                    "url": "https://exemplo.com/ncm/8509.40.10"
                }
            ],
            "keyInsights": ["Liquidificadores são eletrodomésticos com motor elétrico"],
            "confidence": 85.0
        }
    },
    {
        "name": "request_complex",
        "query": "Qual a classificação NCM para um dispositivo médico implantável que combina componentes eletrônicos com medicamentos de liberação controlada?",
        "analysis": {
            "relevantResults": [
                {
                    "title": "NCM 9021.90.91 - Implantes para tratamento médico",
                    "description": "Implantes para uso médico, com componentes eletrônicos",
                    "url": "https://exemplo.com/ncm/9021.90.91"
                },
                {
                    "title": "NCM 3006.10.90 - Outros produtos farmacêuticos",
                    "description": "Produtos farmacêuticos especificados na Nota 4 do Capítulo 30",
                    "url": "https://exemplo.com/ncm/3006.10.90"
                }
            ],
            "keyInsights": ["Dispositivos médicos podem ter múltiplas classificações",
                            "Componentes eletrônicos normalmente são classificados no capítulo 90",
                            "Medicamentos são classificados no capítulo 30"],
            "confidence": 70.0
        }
    }
]

def make_request(request_data):
    """Faz uma requisição ao endpoint de validação e retorna o tempo de resposta."""
    start_time = time.time()
    response = client.post("/api/v1/ncm/validate", json=request_data)
    end_time = time.time()
    
    elapsed_time = (end_time - start_time) * 1000  # Converter para milissegundos
    
    return {
        "status_code": response.status_code,
        "elapsed_ms": elapsed_time,
        "success": response.status_code == 200,
        "response_size": len(response.text) if response.status_code == 200 else 0
    }

def test_sequential_performance():
    """Testa o desempenho do endpoint com requisições sequenciais."""
    print(f"\n🔄 Iniciando teste sequencial com {TEST_CONFIG['num_requests_sequential']} requisições...")
    
    results = []
    start_time_total = time.time()
    
    for i in range(TEST_CONFIG['num_requests_sequential']):
        # Alternar entre os tipos de requisição para diversificar
        request_data = SAMPLE_REQUESTS[i % len(SAMPLE_REQUESTS)]
        
        result = make_request(request_data)
        results.append(result)
        
        if (i + 1) % TEST_CONFIG['log_every_n'] == 0:
            print(f"  ✓ Completadas {i + 1}/{TEST_CONFIG['num_requests_sequential']} requisições")
    
    end_time_total = time.time()
    total_time = end_time_total - start_time_total
    
    # Calcular estatísticas
    elapsed_times = [r["elapsed_ms"] for r in results if r["success"]]
    
    stats = {
        "total_requests": len(results),
        "successful_requests": sum(1 for r in results if r["success"]),
        "failure_rate": (len(results) - sum(1 for r in results if r["success"])) / len(results) * 100,
        "total_time_s": total_time,
        "avg_time_ms": statistics.mean(elapsed_times) if elapsed_times else 0,
        "median_time_ms": statistics.median(elapsed_times) if elapsed_times else 0,
        "p95_time_ms": sorted(elapsed_times)[int(len(elapsed_times) * 0.95) - 1] if len(elapsed_times) >= 20 else 0,
        "min_time_ms": min(elapsed_times) if elapsed_times else 0,
        "max_time_ms": max(elapsed_times) if elapsed_times else 0,
        "std_dev_ms": statistics.stdev(elapsed_times) if len(elapsed_times) > 1 else 0,
        "requests_per_second": len(results) / total_time
    }
    
    # Salvar resultados
    results_file = RESULTS_DIR / "sequential_performance_results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({
            "config": TEST_CONFIG,
            "stats": stats,
            "individual_results": results
        }, f, indent=2)
    
    # Exibir estatísticas
    print("\n📊 Estatísticas do teste sequencial:")
    print(f"  Total de requisições: {stats['total_requests']}")
    print(f"  Requisições com sucesso: {stats['successful_requests']} ({100 - stats['failure_rate']:.2f}%)")
    print(f"  Tempo total: {stats['total_time_s']:.2f}s")
    print(f"  Tempo médio de resposta: {stats['avg_time_ms']:.2f}ms")
    print(f"  Tempo mediano de resposta: {stats['median_time_ms']:.2f}ms")
    print(f"  P95 tempo de resposta: {stats['p95_time_ms']:.2f}ms")
    print(f"  Requisições por segundo: {stats['requests_per_second']:.2f}")
    
    # Verificar se atende aos critérios de desempenho
    assert stats["avg_time_ms"] < 200, f"Tempo médio de resposta ({stats['avg_time_ms']:.2f}ms) excede 200ms"
    assert stats["p95_time_ms"] < 500, f"P95 do tempo de resposta ({stats['p95_time_ms']:.2f}ms) excede 500ms"

def test_concurrent_performance():
    """Testa o desempenho do endpoint com requisições concorrentes."""
    print(f"\n🔄 Iniciando teste concorrente com {TEST_CONFIG['num_requests_concurrent']} requisições...")
    
    results = []
    start_time_total = time.time()
    
    # Preparar lista de requisições
    requests = []
    for i in range(TEST_CONFIG['num_requests_concurrent']):
        request_data = SAMPLE_REQUESTS[i % len(SAMPLE_REQUESTS)]
        requests.append(request_data)
    
    # Executar requisições concorrentes
    with ThreadPoolExecutor(max_workers=TEST_CONFIG['max_workers']) as executor:
        # Submeter tarefas
        future_to_request = {executor.submit(make_request, req): i for i, req in enumerate(requests)}
        
        # Processar resultados à medida que ficam disponíveis
        for i, future in enumerate(as_completed(future_to_request)):
            request_idx = future_to_request[future]
            try:
                result = future.result()
                results.append(result)
                
                if (i + 1) % TEST_CONFIG['log_every_n'] == 0 or i + 1 == len(requests):
                    print(f"  ✓ Completadas {i + 1}/{TEST_CONFIG['num_requests_concurrent']} requisições")
            except Exception as e:
                print(f"  ❌ Erro na requisição {request_idx}: {str(e)}")
                results.append({
                    "status_code": 0,
                    "elapsed_ms": 0,
                    "success": False,
                    "error": str(e)
                })
    
    end_time_total = time.time()
    total_time = end_time_total - start_time_total
    
    # Calcular estatísticas
    elapsed_times = [r["elapsed_ms"] for r in results if r["success"]]
    
    stats = {
        "total_requests": len(results),
        "successful_requests": sum(1 for r in results if r["success"]),
        "failure_rate": (len(results) - sum(1 for r in results if r["success"])) / len(results) * 100,
        "total_time_s": total_time,
        "avg_time_ms": statistics.mean(elapsed_times) if elapsed_times else 0,
        "median_time_ms": statistics.median(elapsed_times) if elapsed_times else 0,
        "p95_time_ms": sorted(elapsed_times)[int(len(elapsed_times) * 0.95) - 1] if len(elapsed_times) >= 20 else 0,
        "min_time_ms": min(elapsed_times) if elapsed_times else 0,
        "max_time_ms": max(elapsed_times) if elapsed_times else 0,
        "std_dev_ms": statistics.stdev(elapsed_times) if len(elapsed_times) > 1 else 0,
        "requests_per_second": len(results) / total_time
    }
    
    # Salvar resultados
    results_file = RESULTS_DIR / "concurrent_performance_results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({
            "config": TEST_CONFIG,
            "stats": stats,
            "individual_results": results
        }, f, indent=2)
    
    # Exibir estatísticas
    print("\n📊 Estatísticas do teste concorrente:")
    print(f"  Total de requisições: {stats['total_requests']}")
    print(f"  Requisições com sucesso: {stats['successful_requests']} ({100 - stats['failure_rate']:.2f}%)")
    print(f"  Tempo total: {stats['total_time_s']:.2f}s")
    print(f"  Tempo médio de resposta: {stats['avg_time_ms']:.2f}ms")
    print(f"  Tempo mediano de resposta: {stats['median_time_ms']:.2f}ms")
    print(f"  P95 tempo de resposta: {stats['p95_time_ms']:.2f}ms")
    print(f"  Requisições por segundo: {stats['requests_per_second']:.2f}")
    
    # Verificar se atende aos critérios de desempenho sob carga
    assert stats["avg_time_ms"] < 300, f"Tempo médio de resposta sob carga ({stats['avg_time_ms']:.2f}ms) excede 300ms"
    assert stats["p95_time_ms"] < 600, f"P95 do tempo de resposta sob carga ({stats['p95_time_ms']:.2f}ms) excede 600ms"

def test_profiling():
    """Testa e perfila o código para identificar gargalos."""
    try:
        import cProfile
        import pstats
        from io import StringIO
        
        print("\n🔍 Executando profiling do endpoint...")
        
        # Usar um caso complexo para profiling
        request_data = SAMPLE_REQUESTS[1]  # Caso complexo
        
        # Executar com profiling
        profiler = cProfile.Profile()
        profiler.enable()
        
        # Fazer várias chamadas para ter dados significativos
        for _ in range(10):
            response = client.post("/api/v1/ncm/validate", json=request_data)
            assert response.status_code == 200
        
        profiler.disable()
        
        # Analisar resultados
        s = StringIO()
        ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
        ps.print_stats(20)  # Mostrar top 20 funções por tempo cumulativo
        
        # Salvar resultados
        with open(RESULTS_DIR / "profiling_results.txt", "w") as f:
            f.write(s.getvalue())
        
        print("  ✓ Profiling concluído. Resultados salvos em 'results/profiling_results.txt'")
        
        # Extrair as 5 funções que consomem mais tempo
        functions = []
        for line in s.getvalue().split('\n')[5:25]:  # Pular cabeçalho
            if line.strip() and not line.startswith(' '):
                functions.append(line.strip())
        
        if functions:
            print("\n  🔥 Top funções por tempo:")
            for i, func in enumerate(functions[:5], 1):
                print(f"    {i}. {func}")
    
    except ImportError:
        print("  ⚠️ Módulos de profiling não disponíveis. Pulando este teste.")

if __name__ == "__main__":
    # Para execução direta do script
    test_sequential_performance()
    test_concurrent_performance()
    test_profiling() 