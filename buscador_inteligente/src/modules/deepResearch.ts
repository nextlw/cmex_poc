import { TokenTracker } from "../utils/token-tracker";
import { FastApiNCMResult, ConsultaProduto } from "../types";

export { FastApiNCMResult };

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

export interface StepResult {
  success: boolean;
  content: string | null;
  error: string | null;
}

export interface ResearchContext {
  productDescription: string;
  currentStep: number;
  previousResponses: string[];
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
      console.error(
        `Erro na análise DeepResearch usando modelo ${this.modelo}:`,
        error
      );
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
    const ncmExistente =
      this.fastApiData?.ncm_code || this.fastApiData?.ncm || "";
    const descricaoExistente =
      this.fastApiData?.description || this.fastApiData?.descricao || "";

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
      modelo: this.modelo,
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
    const resultado = this.fastApiData
      ? { ...this.fastApiData }
      : resultadoDeepResearch;

    // Adiciona seção de validação ao resultado
    resultado.validacao_profunda = {
      resultado: resultadoDeepResearch,
      confianca: this.calcularConfianca(resultado, resultadoDeepResearch),
      timestamp: new Date().toISOString(),
      modelo_utilizado: this.modelo,
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
      fastApiData.description || "",
      deepResearchData.description || ""
    );
    pontuacao += descricaoSimilar * 30;
    totalItens += 30;

    // Compara valores de impostos (se disponíveis)
    if (
      fastApiData.valores_de_impostos &&
      deepResearchData.valores_de_impostos
    ) {
      const impostosIguais =
        JSON.stringify(fastApiData.valores_de_impostos) ===
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
  private async simularAnalise(
    consulta: ConsultaProduto
  ): Promise<FastApiNCMResult> {
    // Simula um delay para parecer uma consulta real
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Utiliza os dados do FastAPI como base ou cria novos se não disponíveis
    const resultadoBase: FastApiNCMResult = this.fastApiData || {
      ncm_code: "61.05.10.00",
      description: "Camisa polo masculina, confeccionada em malha de algodão",
      attributes: {
        material: "Malha de algodão",
        tipo: "Gola polo com fechamento por botões",
        manga: "Manga curta",
        uso: "Para uso masculino",
      },
      taxation: {
        ipi: 0,
        icms: 18,
        pis: 1.65,
        cofins: 7.6,
        import_tax: 0,
      },
      valores_de_impostos: {
        ipi: "0%",
        icms: { SP: "18%" },
        pis: "1.65%",
        cofins: "7.6%",
      },
      conclusion: "Produto classificado corretamente",
      confidence: 0.95,
      model_used: this.modelo,
      processing_time: 1.5,
    };

    // Cria uma "variação" do resultado para simular uma análise independente
    const resultadoDeepResearch = { ...resultadoBase };

    // Adiciona campo específico de observações da análise profunda
    resultadoDeepResearch.observacoes_deep_research = [
      "Classificação validada com base em produtos similares no mercado",
      "Alíquotas de impostos compatíveis com a legislação atual",
      "Verificada compatibilidade com a TIPI 2024",
    ];

    return resultadoDeepResearch;
  }
}

export abstract class DeepResearch {
  protected tokenTracker: TokenTracker;
  protected fastApiData: FastApiNCMResult | null;
  protected consulta: ConsultaProduto;

  constructor(
    tokenTracker: TokenTracker,
    fastApiData: FastApiNCMResult | null,
    consulta: ConsultaProduto
  ) {
    this.tokenTracker = tokenTracker;
    this.fastApiData = fastApiData;
    this.consulta = consulta;
  }

  abstract initialize(): Promise<void>;
  abstract processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult>;

  protected getPromptForStep(step: number, context: ResearchContext): string {
    const basePrompt = `Analise o produto: "${context.productDescription}"`;

    switch (step) {
      case 1:
        return `${basePrompt}\n\nIdentifique o código NCM mais apropriado para este produto. Forneça o código e uma breve justificativa.`;
      case 2:
        return `${basePrompt}\n\nDescreva detalhadamente as características do produto que justificam sua classificação no NCM identificado.`;
      case 3:
        return `${basePrompt}\n\nDetalhe a tributação aplicável a este produto (IPI, ICMS, PIS, COFINS).`;
      case 4:
        return `${basePrompt}\n\nIdentifique atributos específicos do produto que possam impactar sua classificação fiscal.`;
      case 5:
        return `${basePrompt}\n\nForneça uma conclusão final sobre a classificação, incluindo recomendações e observações importantes.`;
      default:
        throw new Error(`Passo ${step} não definido no processo de pesquisa.`);
    }
  }

  async analisar(): Promise<any> {
    try {
      await this.initialize();

      const context: ResearchContext = {
        productDescription: this.consulta.consulta || "",
        currentStep: 1,
        previousResponses: [],
      };

      const results: StepResult[] = [];

      // Executa cada passo do processo
      for (let step = 1; step <= 5; step++) {
        context.currentStep = step;
        const result = await this.processStep(step, context);

        if (!result.success) {
          console.error(`Erro no passo ${step}:`, result.error);
          break;
        }

        if (result.content) {
          context.previousResponses.push(result.content);
        }

        results.push(result);
      }

      // Processa os resultados
      return this.processResults(results);
    } catch (error) {
      console.error("Erro na análise:", error);
      throw error;
    }
  }

  protected processResults(results: StepResult[]): FastApiNCMResult {
    // Implementação base que pode ser sobrescrita pelos modelos específicos
    const ncmResult: FastApiNCMResult = {
      ncm_code: "",
      description: "",
      attributes: {},
      taxation: {
        ipi: 0,
        icms: 0,
        pis: 0,
        cofins: 0,
        import_tax: 0,
      },
      conclusion: "",
      confidence: 0,
      model_used: this.consulta.modelo || "",
      processing_time: 0,
    };

    // Processa cada resultado
    results.forEach((result, index) => {
      if (result.success && result.content) {
        try {
          const content = JSON.parse(result.content);
          switch (index + 1) {
            case 1: // NCM e descrição inicial
              ncmResult.ncm_code = content.ncm_code || "";
              ncmResult.description = content.description || "";
              break;
            case 2: // Características
              ncmResult.attributes = content.attributes || {};
              break;
            case 3: // Tributação
              ncmResult.taxation = content.taxation || ncmResult.taxation;
              break;
            case 4: // Atributos específicos
              Object.assign(ncmResult.attributes, content.attributes || {});
              break;
            case 5: // Conclusão
              ncmResult.conclusion = content.conclusion || "";
              ncmResult.confidence = content.confidence || 0;
              break;
          }
        } catch (error) {
          console.error(
            `Erro ao processar resultado do passo ${index + 1}:`,
            error
          );
        }
      }
    });

    return ncmResult;
  }
}
