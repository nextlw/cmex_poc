from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/ncm",
    tags=["NCM Validation"],
    responses={404: {"description": "Not found"}},
)

class AnalysisData(BaseModel):
    relevantResults: List[Dict[str, Any]]
    keyInsights: List[str]
    confidence: float

class ValidationRequest(BaseModel):
    query: str
    analysis: AnalysisData

class ValidationResponse(BaseModel):
    validation: Dict[str, Any]
    confidence: float
    metadata: Optional[Dict[str, Any]] = None

@router.post("/validate", response_model=ValidationResponse)
async def validate_ncm_analysis(request: ValidationRequest):
    """
    Valida e enriquece os resultados da análise de NCM feita pelo DeepResearch.
    
    Este endpoint recebe os resultados preliminares analisados pelo modelo de IA
    e valida tecnicamente essas informações com base em regras específicas do NCM,
    além de adicionar metadados e informações complementares.
    """
    try:
        # Extrair dados da solicitação
        query = request.query
        analysis = request.analysis
        
        # Obter resultados relevantes da análise
        relevant_results = analysis.relevantResults
        
        # Realizar validação técnica
        validation_result = {}
        confidence_score = analysis.confidence  # Iniciar com a confiança da análise
        
        # Verificar se existem resultados relevantes
        if not relevant_results or len(relevant_results) == 0:
            validation_result["status"] = "insufficient_data"
            validation_result["message"] = "Dados insuficientes para validação técnica"
            confidence_score = min(confidence_score, 30.0)
        else:
            # Extrair códigos NCM mencionados nos resultados
            ncm_codes = []
            descriptions = []
            
            for result in relevant_results:
                # Extrair códigos NCM do texto (formato: XXXX.XX.XX)
                if "description" in result:
                    descriptions.append(result["description"])
                
                if "title" in result and any(c.isdigit() for c in result["title"]):
                    potential_code = ''.join(c for c in result["title"] if c.isdigit() or c == '.')
                    if len(potential_code) >= 8 and potential_code.count('.') >= 1:
                        ncm_codes.append(potential_code)
            
            # Validar consistência entre resultados
            if len(ncm_codes) > 0:
                # Verificar se os códigos NCM são consistentes
                if len(set(ncm_codes)) == 1:
                    # Todos os códigos são iguais - alta confiança
                    validation_result["status"] = "validated"
                    validation_result["message"] = f"Código NCM {ncm_codes[0]} validado com alta confiança"
                    validation_result["ncm_code"] = ncm_codes[0]
                    confidence_score = min(confidence_score + 15.0, 95.0)
                else:
                    # Códigos divergentes - confiança reduzida
                    validation_result["status"] = "conflicting_data"
                    validation_result["message"] = "Códigos NCM divergentes nos resultados"
                    validation_result["possible_codes"] = list(set(ncm_codes))
                    confidence_score = min(confidence_score, 70.0)
            else:
                # Nenhum código NCM encontrado - verificar descrições
                if len(descriptions) > 0:
                    validation_result["status"] = "needs_classification"
                    validation_result["message"] = "Descrição encontrada, mas requer classificação manual"
                    validation_result["descriptions"] = descriptions
                    confidence_score = min(confidence_score, 50.0)
                else:
                    validation_result["status"] = "insufficient_data"
                    validation_result["message"] = "Dados insuficientes para validação técnica"
                    confidence_score = min(confidence_score, 30.0)
            
            # Adicionar insights da análise
            validation_result["insights"] = analysis.keyInsights
        
        # Adicionar metadados
        metadata = {
            "validation_timestamp": datetime.now().isoformat(),
            "query_complexity": len(query.split()) / 10,  # Métrica simples de complexidade
            "data_sources": len(relevant_results)
        }
        
        # Retornar resposta
        return ValidationResponse(
            validation=validation_result,
            confidence=confidence_score,
            metadata=metadata
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao validar análise NCM: {str(e)}"
        ) 