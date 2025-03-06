import { TokenTracker } from '../utils/token-tracker';
import { ConsultaProduto } from '../controllers/ncm';

/**
 * Interface para os dados de resultado do FastAPI
 */
export interface FastApiNCMResult {
  ncm: string;
  descricao: string;
  atributos?: string[];
  atributos_tipi?: string[];
  valores_de_impostos?: Record<string, any>;
  classificacao_tributaria?: Record<string, any>;
  [key: string]: any; // Permite campos adicionais
}

/**
 * Interface para resultados de validação do DeepResearch
 */
export interface DeepResearchValidation {
  confianca: number;
  ncm_original: string;
  ncm_sugerido: string;
  descricao_original: string;
  descricao_sugerida: string;
  observacoes: string[];
  discrepancias: {
    ncm: boolean;
    descricao: boolean;
    atributos: boolean;
    impostos: boolean;
  };
  timestamp: string;
}

/**
 * Classe base para DeepResearch
 * Responsável por realizar análise profunda e validação de resultados de NCM
 */
export class ModuloDeepResearch {
  protected modelo: string;
  protected fastApiData: FastApiNCMResult | null;
  protected tokenTracker: TokenTracker;
  protected consultaOriginal: ConsultaProduto;
  
  /**
   * Construtor do módulo DeepResearch
   * 
   * @param modelo Nome do modelo a ser utilizado
   * @param fastApiData Dados retornados pelo FastAPI (opcional)
   * @param consultaOriginal Parâmetros originais da consulta
   */
  constructor(
    modelo: string, 
    fastApiData: FastApiNCMResult | null, 
    consultaOriginal: ConsultaProduto
  ) {
    this.modelo = modelo;
    this.fastApiData = fastApiData;
    this.consultaOriginal = consultaOriginal;
    this.tokenTracker = new TokenTracker();
  }
  
  /**
   * Realiza análise profunda da consulta NCM
   * 
   * @returns Resultado da análise enriquecido
   */
  async analisar(): Promise<any> {
    try {
      // Prepara a consulta para o modelo específico
      const consultaFinal = this.prepararConsulta();
      
      // Aqui entraria a lógica de análise de acordo com o modelo
      // Implementação específica a ser feita pelos módulos derivados
      
      // Simula resultado para desenvolvimento
      const resultadoAnalise = await this.simularAnalise(consultaFinal);
      
      // Combina resultados do FastAPI com os resultados da análise
      return this.combinarResultados(resultadoAnalise);
    } catch (error) {
      console.error(`Erro na análise DeepResearch usando modelo ${this.modelo}:`, error);
      throw error;
    }
  }
  
  /**
   * Prepara a consulta específica para o modelo escolhido
   * 
   * @returns Objeto de consulta formatado para o modelo
   */
  protected prepararConsulta(): ConsultaProduto {
    // Utiliza os dados do FastAPI como base, se disponíveis
    const ncmExistente = this.fastApiData?.ncm || '';
    const descricaoExistente = this.fastApiData?.descricao || '';
    
    // Define o prompt com contexto do resultado do FastAPI
    const contextoProduto = this.fastApiData 
      ? `Validar o NCM ${ncmExistente} (${descricaoExistente}) para o produto "${this.consultaOriginal.consulta}"`
      : `Classificar o NCM para o produto "${this.consultaOriginal.consulta}"`;
    
    return {
      consulta: contextoProduto,
      estadoOrigem: this.consultaOriginal.estadoOrigem,
      operacao: this.consultaOriginal.operacao,
      regimeTributario: this.consultaOriginal.regimeTributario,
      tributacao: this.consultaOriginal.tributacao,
      modelo: this.modelo
    };
  }
  
  /**
   * Combina os resultados do FastAPI com os da análise profunda
   * 
   * @param resultadoDeepResearch Resultado da análise do DeepResearch
   * @returns Objeto combinado com ambos os resultados
   */
  protected combinarResultados(resultadoDeepResearch: any): any {
    // Determina qual NCM usar (FastAPI ou o sugerido pelo modelo)
    const resultado = this.fastApiData ? { ...this.fastApiData } : resultadoDeepResearch;
    
    // Adiciona seção de validação ao resultado
    resultado.validacao_profunda = {
      resultado: resultadoDeepResearch,
      confianca: this.calcularConfianca(resultado, resultadoDeepResearch),
      timestamp: new Date().toISOString(),
      modelo_utilizado: this.modelo
    };
    
    return resultado;
  }
  
  /**
   * Calcula o nível de confiança da validação com base na concordância entre resultados
   * 
   * @param fastApiData Dados do FastAPI (ou null se não disponível)
   * @param deepResearchData Dados da análise profunda
   * @returns Percentual de confiança (0-100)
   */
  protected calcularConfianca(fastApiData: any, deepResearchData: any): number {
    // Se não temos dados do FastAPI, a confiança é baseada apenas na análise do modelo
    if (!this.fastApiData) {
      return 85; // Valor padrão quando não há comparação
    }
    
    // Inicializa pontuação base
    let pontuacao = 0;
    let totalItens = 0;
    
    // Compara os NCMs (maior peso)
    if (fastApiData.ncm === deepResearchData.ncm) {
      pontuacao += 40;
    }
    totalItens += 40;
    
    // Compara as descrições (análise semântica simplificada)
    const descricaoSimilar = this.compararTextos(
      fastApiData.descricao || '',
      deepResearchData.descricao || ''
    );
    pontuacao += descricaoSimilar * 30;
    totalItens += 30;
    
    // Compara valores de impostos (se disponíveis)
    if (fastApiData.valores_de_impostos && deepResearchData.valores_de_impostos) {
      const impostosIguais = JSON.stringify(fastApiData.valores_de_impostos) === 
                             JSON.stringify(deepResearchData.valores_de_impostos);
      if (impostosIguais) pontuacao += 30;
      totalItens += 30;
    }
    
    // Calcula pontuação final (0-100)
    return Math.round((pontuacao / totalItens) * 100);
  }
  
  /**
   * Compara similaridade entre dois textos (implementação simplificada)
   * 
   * @param texto1 Primeiro texto
   * @param texto2 Segundo texto
   * @returns Valor entre 0 e 1 (0 = totalmente diferente, 1 = idênticos)
   */
  private compararTextos(texto1: string, texto2: string): number {
    // Implementação muito simplificada para demonstração
    // Em produção, usaria técnicas de NLP/embeddings para análise semântica
    
    const palavras1 = new Set(texto1.toLowerCase().split(/\s+/));
    const palavras2 = new Set(texto2.toLowerCase().split(/\s+/));
    
    let intersecao = 0;
    for (const palavra of palavras1) {
      if (palavras2.has(palavra)) intersecao++;
    }
    
    const uniao = palavras1.size + palavras2.size - intersecao;
    return uniao === 0 ? 1 : intersecao / uniao;
  }
  
  /**
   * Método para simular resultado da análise (usado em desenvolvimento)
   * Em produção, seria substituído por chamada real ao modelo
   */
  private async simularAnalise(consulta: ConsultaProduto): Promise<any> {
    // Simula um delay para parecer uma consulta real
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Utiliza os dados do FastAPI como base ou cria novos se não disponíveis
    const resultadoBase = this.fastApiData || {
      ncm: "61.05.10.00",
      descricao: "Camisa polo masculina, confeccionada em malha de algodão",
      atributos: [
        "Confeccionada em malha de algodão",
        "Gola polo com fechamento por botões",
        "Manga curta",
        "Para uso masculino"
      ],
      atributos_tipi: [
        "Camisas de malha, de algodão, de uso masculino",
        "Produto do capítulo 61 - Vestuário e seus acessórios, de malha",
      ],
      valores_de_impostos: {
        ipi: "0%",
        icms: {"SP": "18%"},
        pis: "1,65%",
        cofins: "7,6%"
      }
    };
    
    // Cria uma "variação" do resultado para simular uma análise independente
    const resultadoDeepResearch = { ...resultadoBase };
    
    // Adiciona campo específico de observações da análise profunda
    resultadoDeepResearch.observacoes_deep_research = [
      "Classificação validada com base em produtos similares no mercado",
      "Alíquotas de impostos compatíveis com a legislação atual",
      "Verificada compatibilidade com a TIPI 2024"
    ];
    
    return resultadoDeepResearch;
  }
} 