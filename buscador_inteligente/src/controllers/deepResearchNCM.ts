import { Request, Response } from 'express';
import { ModuloDeepResearch, FastApiNCMResult } from '../modules/deepResearch';
import { ConsultaProduto } from './ncm';
import { obterSugestoesGPT4, obterSugestoesClaude, obterSugestoesDeepseek, obterSugestoesQwen } from './ncm';

// Classe específica que herda do módulo base e implementa para o modelo GPT-4
class DeepResearchGPT4 extends ModuloDeepResearch {
  async analisar(): Promise<any> {
    try {
      const consultaPreparada = this.prepararConsulta();
      const resultado = await obterSugestoesGPT4(consultaPreparada);
      return this.combinarResultados(resultado);
    } catch (error) {
      console.error('Erro ao processar DeepResearch com GPT-4:', error);
      // Retorna qualquer resultado do FastAPI disponível ou um objeto vazio
      if (this.fastApiData) return this.fastApiData;
      throw error;
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo Claude
class DeepResearchClaude extends ModuloDeepResearch {
  async analisar(): Promise<any> {
    try {
      const consultaPreparada = this.prepararConsulta();
      const resultado = await obterSugestoesClaude(consultaPreparada);
      return this.combinarResultados(resultado);
    } catch (error) {
      console.error('Erro ao processar DeepResearch com Claude:', error);
      if (this.fastApiData) return this.fastApiData;
      throw error;
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo Deepseek
class DeepResearchDeepseek extends ModuloDeepResearch {
  async analisar(): Promise<any> {
    try {
      const consultaPreparada = this.prepararConsulta();
      const resultado = await obterSugestoesDeepseek(consultaPreparada);
      return this.combinarResultados(resultado);
    } catch (error) {
      console.error('Erro ao processar DeepResearch com Deepseek:', error);
      if (this.fastApiData) return this.fastApiData;
      throw error;
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo Qwen
class DeepResearchQwen extends ModuloDeepResearch {
  async analisar(): Promise<any> {
    try {
      const consultaPreparada = this.prepararConsulta();
      
      // Se estamos em modo de desenvolvimento com mock, usa simulação
      if (process.env.NODE_ENV === 'development' && process.env.MOCK_RESPONSES === 'true') {
        return super.analisar();
      }
      
      const resultado = await obterSugestoesQwen(consultaPreparada);
      return this.combinarResultados(resultado);
    } catch (error) {
      console.error('Erro ao processar DeepResearch com Qwen:', error);
      if (this.fastApiData) return this.fastApiData;
      throw error;
    }
  }
}

// Factory para criar instâncias dos diferentes modelos de DeepResearch
const modelFactory: Record<string, (fastApiData: FastApiNCMResult | null, consulta: ConsultaProduto) => ModuloDeepResearch> = {
  'Nex-0.1-Pro-2024': (fastApiData: FastApiNCMResult | null, consulta: ConsultaProduto) => 
    new DeepResearchGPT4('gpt4', fastApiData, consulta),
    
  'Nex-0.3-Preview-2024': (fastApiData: FastApiNCMResult | null, consulta: ConsultaProduto) => 
    new DeepResearchClaude('claude', fastApiData, consulta),
    
  'Nex-0.5-Preview-2025': (fastApiData: FastApiNCMResult | null, consulta: ConsultaProduto) => 
    new DeepResearchDeepseek('deepseek', fastApiData, consulta),
    
  'Qwen2.5-7b-instruct-1m': (fastApiData: FastApiNCMResult | null, consulta: ConsultaProduto) => 
    new DeepResearchQwen('qwen', fastApiData, consulta)
};

/**
 * Controlador para processamento DeepResearch de consultas NCM
 * 
 * @param req Requisição Express com dados da FastAPI e consulta original
 * @param res Resposta Express
 */
export async function processarDeepResearch(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  try {
    // Extrai parâmetros da requisição
    const consultaParams = req.body as ConsultaProduto;
    const fastApiResult = req.fastApiResult as FastApiNCMResult | null;
    const { modelo } = consultaParams;
    
    console.log(`Iniciando processamento DeepResearch para NCM com modelo: ${modelo}`);
    
    // Verifica se o modelo é válido
    if (!modelFactory[modelo]) {
      res.status(400).json({
        status_code: 400,
        errors: [{
          loc: ["body", "modelo"],
          msg: "Modelo não encontrado ou inválido para DeepResearch",
          type: "error.invalid_value",
          ctx: { valor_fornecido: modelo }
        }],
        message: "Modelo não encontrado ou inválido para DeepResearch",
        error_type: "invalid_value"
      });
      return;
    }
    
    // 1. Utiliza o factory para criar o módulo adequado
    const moduloDeepResearch = modelFactory[modelo](fastApiResult, consultaParams);
    
    // 2. Executa a análise profunda
    const resultadoEnriquecido = await moduloDeepResearch.analisar();
    
    // 3. Calcula o tempo decorrido
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000; // em segundos
    
    // Log de duração da consulta
    console.log(`Consulta DeepResearch NCM concluída em ${elapsedTime.toFixed(2)}s (modelo: ${modelo})`);
    
    // 4. Retorna a resposta enriquecida
    res.status(200).json({
      ...resultadoEnriquecido,
      _meta: {
        processamento: "deep_research",
        tempo_processamento: elapsedTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Erro no processamento DeepResearch:', error);
    
    // Fallback para resposta do FastAPI se disponível
    if (req.fastApiResult) {
      res.status(200).json({
        ...req.fastApiResult,
        _meta: {
          processamento: "fastapi_fallback",
          erro_deep_research: error.message || "Erro desconhecido",
          timestamp: new Date().toISOString()
        }
      });
      return;
    }
    
    // Caso não tenha resposta do FastAPI, retorna erro
    res.status(500).json({
      status_code: 500,
      errors: [{
        loc: ["deep_research"],
        msg: error.message || "Erro ao processar análise profunda",
        type: "error.deep_research_error"
      }],
      message: error.message || "Erro ao processar análise profunda",
      error_type: "deep_research_error"
    });
  }
} 