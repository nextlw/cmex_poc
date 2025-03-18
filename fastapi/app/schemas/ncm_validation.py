from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalysisData(BaseModel):
    """
    Modelo para dados de análise de NCM.
    
    Attributes:
        relevantResults: Lista de resultados relevantes da análise
        keyInsights: Lista de insights chave extraídos
        confidence: Nível de confiança da análise (0-100)
    """
    relevantResults: List[Dict[str, Any]]
    keyInsights: List[str]
    confidence: float

class ValidationRequest(BaseModel):
    """
    Modelo para requisição de validação de NCM.
    
    Attributes:
        query: Consulta original do usuário
        analysis: Dados de análise para validação
    """
    query: str
    analysis: AnalysisData

class ValidationResponse(BaseModel):
    """
    Modelo para resposta de validação de NCM.
    
    Attributes:
        validation: Resultado da validação técnica
        confidence: Nível de confiança da validação (0-100)
        metadata: Metadados adicionais da validação
    """
    validation: Dict[str, Any]
    confidence: float
    metadata: Optional[Dict[str, Any]] = None 