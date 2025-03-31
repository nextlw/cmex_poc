import pytest
from fastapi.testclient import TestClient
import json
import os
import sys
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent))

from main import app
from app.schemas.ncm_validation import ValidationRequest, AnalysisData

# Cliente de teste
client = TestClient(app)

# Diretório para amostras de teste
TEST_DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"

# Criar diretórios se não existirem
TEST_DATA_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

# Dados de teste
TEST_CASES = [
    {
        "name": "ncm_codigo_consistente",
        "query": "Como classificar um liquidificador elétrico doméstico?",
        "analysis": {
            "relevantResults": [
                {
                    "title": "NCM 8509.40.10 - Liquidificadores",
                    "description": "Liquidificadores com motor elétrico incorporado, de uso doméstico",
                    "url": "https://exemplo.com/ncm/8509.40.10"
                },
                {
                    "title": "Classificação de Eletrodomésticos - NCM 8509.40.10",
                    "description": "Os liquidificadores domésticos são classificados no NCM 8509.40.10",
                    "url": "https://exemplo.com/eletrodomesticos"
                }
            ],
            "keyInsights": ["Liquidificadores são eletrodomésticos com motor elétrico", 
                           "Usados para preparação de alimentos",
                           "Classificados em NCM específico para uso doméstico"],
            "confidence": 85.0
        },
        "expected_status": "validated",
        "expected_confidence_min": 85.0
    },
    {
        "name": "ncm_codigos_divergentes",
        "query": "Qual NCM para sapatos esportivos?",
        "analysis": {
            "relevantResults": [
                {
                    "title": "NCM 6402.19.00 - Calçados esportivos",
                    "description": "Calçados esportivos com sola exterior e parte superior de borracha ou plástico",
                    "url": "https://exemplo.com/ncm/6402.19.00"
                },
                {
                    "title": "NCM 6404.11.00 - Calçados para esportes",
                    "description": "Calçados para esportes com sola exterior de borracha ou plástico e parte superior de matéria têxtil",
                    "url": "https://exemplo.com/ncm/6404.11.00"
                }
            ],
            "keyInsights": ["Classificação varia de acordo com o material", 
                           "Existem categorias específicas para esportes"],
            "confidence": 70.0
        },
        "expected_status": "conflicting_data",
        "expected_confidence_max": 70.0
    },
    {
        "name": "sem_codigo_com_descricao",
        "query": "Como classificar um perfume importado de luxo?",
        "analysis": {
            "relevantResults": [
                {
                    "title": "Classificação de Perfumes",
                    "description": "Perfumes e águas-de-colônia são normalmente classificados no Capítulo 33 da NCM",
                    "url": "https://exemplo.com/cosmeticos"
                }
            ],
            "keyInsights": ["Perfumes são classificados como cosméticos", 
                           "A origem não afeta a classificação NCM"],
            "confidence": 60.0
        },
        "expected_status": "needs_classification",
        "expected_confidence_max": 60.0
    },
    {
        "name": "sem_dados_relevantes",
        "query": "Classificação NCM para tecnologia de computação quântica",
        "analysis": {
            "relevantResults": [],
            "keyInsights": ["Tecnologia emergente sem classificação específica"],
            "confidence": 30.0
        },
        "expected_status": "insufficient_data",
        "expected_confidence_max": 30.0
    }
]

# Salvar casos de teste como amostras
for case in TEST_CASES:
    case_file = TEST_DATA_DIR / f"{case['name']}.json"
    with open(case_file, "w", encoding="utf-8") as f:
        json.dump(case, f, ensure_ascii=False, indent=2)

# Função para carregar casos de teste
def load_test_cases():
    cases = []
    for case_file in TEST_DATA_DIR.glob("*.json"):
        with open(case_file, "r", encoding="utf-8") as f:
            cases.append(json.load(f))
    return cases

# Testes paramétricos
@pytest.mark.parametrize("test_case", load_test_cases())
def test_ncm_validation(test_case):
    """Testa a validação de NCM com diferentes casos de uso."""
    # Preparar dados de requisição
    request_data = {
        "query": test_case["query"],
        "analysis": test_case["analysis"]
    }
    
    # Salvar entrada para referência
    with open(RESULTS_DIR / f"{test_case['name']}_input.json", "w", encoding="utf-8") as f:
        json.dump(request_data, f, ensure_ascii=False, indent=2)
    
    # Fazer requisição ao endpoint
    response = client.post("/api/v1/ncm/validate", json=request_data)
    
    # Salvar resposta para análise
    with open(RESULTS_DIR / f"{test_case['name']}_response.json", "w", encoding="utf-8") as f:
        f.write(response.text)
    
    # Verificar status code
    assert response.status_code == 200, f"Falha no caso {test_case['name']}: status code {response.status_code}"
    
    # Analisar resposta
    response_data = response.json()
    
    # Verificar estrutura da resposta
    assert "validation" in response_data, "Campo 'validation' ausente na resposta"
    assert "confidence" in response_data, "Campo 'confidence' ausente na resposta"
    assert "metadata" in response_data, "Campo 'metadata' ausente na resposta"
    
    # Verificar status esperado
    expected_status = test_case.get("expected_status")
    if expected_status:
        assert response_data["validation"]["status"] == expected_status, \
            f"Status esperado: {expected_status}, recebido: {response_data['validation']['status']}"
    
    # Verificar confiança
    expected_confidence_min = test_case.get("expected_confidence_min")
    if expected_confidence_min is not None:
        assert response_data["confidence"] >= expected_confidence_min, \
            f"Confiança mínima esperada: {expected_confidence_min}, recebida: {response_data['confidence']}"
    
    expected_confidence_max = test_case.get("expected_confidence_max")
    if expected_confidence_max is not None:
        assert response_data["confidence"] <= expected_confidence_max, \
            f"Confiança máxima esperada: {expected_confidence_max}, recebida: {response_data['confidence']}"
    
    # Verificar insights
    if "keyInsights" in test_case["analysis"]:
        if response_data["validation"].get("insights"):
            assert all(insight in response_data["validation"]["insights"] 
                      for insight in test_case["analysis"]["keyInsights"]), \
                "Insights da análise não foram preservados na resposta"
    
    # Verificar metadados
    assert "validation_timestamp" in response_data["metadata"], "Timestamp de validação ausente"
    assert "query_complexity" in response_data["metadata"], "Complexidade de consulta ausente"
    
    # Log de sucesso
    print(f"✅ Teste {test_case['name']} passou com sucesso. "
          f"Confiança: {response_data['confidence']}, "
          f"Status: {response_data['validation']['status']}")

# Teste de análise de confiança
def test_confidence_correlation():
    """Testa se o nível de confiança está correlacionado com a qualidade dos dados."""
    # Carregar todos os resultados dos testes
    confidence_values = {}
    for case in TEST_CASES:
        response_file = RESULTS_DIR / f"{case['name']}_response.json"
        if response_file.exists():
            with open(response_file, "r", encoding="utf-8") as f:
                response_data = json.load(f)
                confidence_values[case["name"]] = {
                    "confidence": response_data["confidence"],
                    "status": response_data["validation"]["status"]
                }
    
    # Verificar correlação
    if confidence_values:
        # Os casos de teste estão ordenados do mais confiável para o menos confiável
        statuses_in_expected_order = [
            "validated",
            "conflicting_data",
            "needs_classification",
            "insufficient_data"
        ]
        
        # Verificar se a confiança decresce conforme o status se torna menos confiável
        status_confidences = {}
        for status in statuses_in_expected_order:
            values = [v["confidence"] for v in confidence_values.values() if v["status"] == status]
            if values:
                status_confidences[status] = sum(values) / len(values)
        
        # Verificar se os valores de confiança seguem a ordem esperada
        prev_confidence = float('inf')
        for status in statuses_in_expected_order:
            if status in status_confidences:
                assert status_confidences[status] <= prev_confidence, \
                    f"A confiança para {status} deveria ser menor que o status anterior"
                prev_confidence = status_confidences[status]

if __name__ == "__main__":
    # Para execução direta do script
    for case in TEST_CASES:
        test_ncm_validation(case) 