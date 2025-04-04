/**
 * AtributosNCMAgent - Agente especializado em raciocínio sobre atributos NCM
 *
 * Este agente é responsável por analisar os atributos disponíveis para um NCM
 * e selecionar os mais relevantes com base em diversos critérios.
 */

import { AtributoNCM } from "../types/atributos";

// Tipos para configuração do raciocínio do agente
export interface AtributosNCMAgentConfig {
  // Filtros para categorias de produtos
  filtroCategoria?: string;
  // Filtros para órgãos específicos
  orgaosInteresse?: string[];
  // Filtros para objetivos específicos
  objetivosInteresse?: string[];
  // Filtro para modalidade (importação/exportação/ambos)
  modalidade?: string;
  // Incluir apenas atributos obrigatórios
  apenasObrigatorios?: boolean;
  // Configuração para ambiente de produção ou desenvolvimento
  ambiente: "producao" | "desenvolvimento";
  // Data de referência para análise de vigência (padrão: data atual)
  dataReferencia?: Date;
}

// Interface para resultado da análise
export interface ResultadoAnaliseAtributos {
  atributosSelecionados: AtributoNCM[];
  agrupamentos: {
    porOrgao: Record<string, AtributoNCM[]>;
    porObjetivo: Record<string, AtributoNCM[]>;
    porObrigatoriedade: {
      obrigatorios: AtributoNCM[];
      opcionais: AtributoNCM[];
    };
  };
  metricas: {
    totalAnalisados: number;
    totalSelecionados: number;
    percentualSelecionado: number;
  };
  recomendacoes: string[];
}

export class AtributosNCMAgent {
  private config: AtributosNCMAgentConfig;

  constructor(config: AtributosNCMAgentConfig) {
    this.config = {
      ...config,
      dataReferencia: config.dataReferencia || new Date(),
    };
  }

  /**
   * Analisa os atributos de um NCM e seleciona os mais relevantes
   * baseado na configuração do agente e contexto de uso.
   *
   * @param atributos Lista completa de atributos do NCM
   * @param contexto Contexto adicional para análise (opcional)
   * @returns Resultado da análise com os atributos selecionados
   */
  public analisarAtributos(
    atributos: AtributoNCM[],
    contexto?: Record<string, any>
  ): ResultadoAnaliseAtributos {
    if (!atributos || atributos.length === 0) {
      return this.criarResultadoVazioInterno();
    }

    console.log(`Iniciando análise de ${atributos.length} atributos NCM`);

    // 1. Filtrar por validade temporal
    const atributosValidos = this.filtrarPorValidade(atributos);

    // 2. Aplicar filtros básicos (modalidade, órgãos, obrigatoriedade)
    let atributosFiltrados = this.aplicarFiltrosBasicos(atributosValidos);

    // 3. Aplicar contexto específico, se fornecido
    if (contexto) {
      atributosFiltrados = this.aplicarContextoEspecifico(
        atributosFiltrados,
        contexto
      );
    }

    // 4. Enriquecimento de contexto e priorização
    const atributosPriorizados = this.priorizarAtributos(atributosFiltrados);

    // 5. Agrupar para análise
    const agrupamentos = this.agruparAtributos(atributosPriorizados);

    // 6. Gerar recomendações baseadas na análise
    const recomendacoes = this.gerarRecomendacoes(
      atributosPriorizados,
      atributos.length,
      agrupamentos
    );

    // 7. Montar resultado
    return {
      atributosSelecionados: atributosPriorizados,
      agrupamentos,
      metricas: {
        totalAnalisados: atributos.length,
        totalSelecionados: atributosPriorizados.length,
        percentualSelecionado: Math.round(
          (atributosPriorizados.length / atributos.length) * 100
        ),
      },
      recomendacoes,
    };
  }

  /**
   * Filtra atributos com base na data de vigência
   */
  private filtrarPorValidade(atributos: AtributoNCM[]): AtributoNCM[] {
    const dataReferencia = this.config.dataReferencia as Date;

    return atributos.filter((attr) => {
      // Verificar início da vigência
      const dataInicio = attr.dataInicioVigencia
        ? new Date(attr.dataInicioVigencia)
        : null;

      // Verificar fim da vigência (se existir)
      const dataFim = attr.dataFimVigencia
        ? new Date(attr.dataFimVigencia)
        : null;

      // Verificar se a data de referência está dentro do período de vigência
      const valido =
        (!dataInicio || dataInicio <= dataReferencia) &&
        (!dataFim || dataFim >= dataReferencia);

      return valido;
    });
  }

  /**
   * Aplica filtros básicos de modalidade, órgãos e obrigatoriedade
   */
  private aplicarFiltrosBasicos(atributos: AtributoNCM[]): AtributoNCM[] {
    return atributos.filter((attr) => {
      // Filtro de modalidade
      if (
        this.config.modalidade &&
        attr.modalidade.toUpperCase() !==
          this.config.modalidade.toUpperCase() &&
        attr.modalidade.toUpperCase() !== "AMBOS"
      ) {
        return false;
      }

      // Filtro de órgãos
      if (
        this.config.orgaosInteresse &&
        this.config.orgaosInteresse.length > 0
      ) {
        const possuiOrgaoInteresse = attr.orgaos.some((orgao) =>
          this.config.orgaosInteresse?.includes(orgao)
        );
        if (!possuiOrgaoInteresse) return false;
      }

      // Filtro de obrigatoriedade
      if (this.config.apenasObrigatorios && !attr.obrigatorio) {
        return false;
      }

      // Filtro de objetivos
      if (
        this.config.objetivosInteresse &&
        this.config.objetivosInteresse.length > 0
      ) {
        const possuiObjetivoInteresse = attr.objetivos.some((obj) =>
          this.config.objetivosInteresse?.includes(obj.descricao)
        );
        if (!possuiObjetivoInteresse) return false;
      }

      return true;
    });
  }

  /**
   * Aplica contexto específico para análise mais detalhada
   */
  private aplicarContextoEspecifico(
    atributos: AtributoNCM[],
    contexto: Record<string, any>
  ): AtributoNCM[] {
    // Implementação pode variar com base no contexto fornecido
    // Exemplo: filtrar por categoria específica, filtrar por palavras-chave, etc.
    let resultado = [...atributos];

    // Filtro por categoria de produto
    if (contexto.categoriaProduto) {
      // Aqui poderia ser implementada uma lógica de similaridade semântica
      // ou busca por palavras-chave na descrição do atributo
      console.log(
        `Aplicando filtro contextual: categoriaProduto=${contexto.categoriaProduto}`
      );
    }

    // Filtro por finalidade do produto
    if (contexto.finalidadeProduto) {
      console.log(
        `Aplicando filtro contextual: finalidadeProduto=${contexto.finalidadeProduto}`
      );
    }

    return resultado;
  }

  /**
   * Prioriza atributos com base na relevância para o contexto
   */
  private priorizarAtributos(atributos: AtributoNCM[]): AtributoNCM[] {
    // Implementação de priorização - poderia ordenar por relevância
    return atributos.sort((a, b) => {
      // Prioridade 1: Atributos obrigatórios primeiro
      if (a.obrigatorio !== b.obrigatorio) {
        return a.obrigatorio ? -1 : 1;
      }

      // Prioridade 2: Atributos da ANVISA e órgãos importantes
      const orgaosImportantes = ["ANVISA", "RECEITA", "INMETRO"];
      const aTemOrgaoImportante = a.orgaos.some((org) =>
        orgaosImportantes.includes(org)
      );
      const bTemOrgaoImportante = b.orgaos.some((org) =>
        orgaosImportantes.includes(org)
      );

      if (aTemOrgaoImportante !== bTemOrgaoImportante) {
        return aTemOrgaoImportante ? -1 : 1;
      }

      // Ordem alfabética como critério final
      return a.nomeApresentacao.localeCompare(b.nomeApresentacao);
    });
  }

  /**
   * Agrupa atributos por diferentes critérios para análise
   */
  private agruparAtributos(
    atributos: AtributoNCM[]
  ): ResultadoAnaliseAtributos["agrupamentos"] {
    const porOrgao: Record<string, AtributoNCM[]> = {};
    const porObjetivo: Record<string, AtributoNCM[]> = {};
    const obrigatorios: AtributoNCM[] = [];
    const opcionais: AtributoNCM[] = [];

    atributos.forEach((attr) => {
      // Agrupar por órgão
      attr.orgaos.forEach((orgao) => {
        if (!porOrgao[orgao]) porOrgao[orgao] = [];
        porOrgao[orgao].push(attr);
      });

      // Agrupar por objetivo
      attr.objetivos.forEach((obj) => {
        if (!porObjetivo[obj.descricao]) porObjetivo[obj.descricao] = [];
        porObjetivo[obj.descricao].push(attr);
      });

      // Agrupar por obrigatoriedade
      if (attr.obrigatorio) {
        obrigatorios.push(attr);
      } else {
        opcionais.push(attr);
      }
    });

    return {
      porOrgao,
      porObjetivo,
      porObrigatoriedade: {
        obrigatorios,
        opcionais,
      },
    };
  }

  /**
   * Gera recomendações baseadas na análise dos atributos
   */
  private gerarRecomendacoes(
    atributosSelecionados: AtributoNCM[],
    totalOriginal: number,
    agrupamentos: ResultadoAnaliseAtributos["agrupamentos"]
  ): string[] {
    const recomendacoes: string[] = [];

    // Informações sobre cobertura
    if (atributosSelecionados.length === 0) {
      recomendacoes.push(
        "Nenhum atributo relevante encontrado para esta NCM com os filtros aplicados."
      );
    } else {
      const percentual = Math.round(
        (atributosSelecionados.length / totalOriginal) * 100
      );

      recomendacoes.push(
        `Foram selecionados ${atributosSelecionados.length} atributos de um total de ${totalOriginal} (${percentual}%).`
      );
    }

    // Avisos sobre atributos obrigatórios
    const { obrigatorios } = agrupamentos.porObrigatoriedade;
    if (obrigatorios.length > 0) {
      recomendacoes.push(
        `Atenção: Existem ${obrigatorios.length} atributos de preenchimento obrigatório.`
      );
    }

    // Recomendações específicas por órgão
    const orgaosRelevantes = Object.keys(agrupamentos.porOrgao);
    if (orgaosRelevantes.includes("ANVISA")) {
      recomendacoes.push(
        `Importante: ${agrupamentos.porOrgao["ANVISA"].length} atributos são exigidos pela ANVISA.`
      );
    }

    return recomendacoes;
  }

  /**
   * Cria um resultado vazio para quando não há atributos
   * Método público para uso externo pelo serviço
   */
  public criarResultadoVazio(): ResultadoAnaliseAtributos {
    return {
      atributosSelecionados: [],
      agrupamentos: {
        porOrgao: {},
        porObjetivo: {},
        porObrigatoriedade: {
          obrigatorios: [],
          opcionais: [],
        },
      },
      metricas: {
        totalAnalisados: 0,
        totalSelecionados: 0,
        percentualSelecionado: 0,
      },
      recomendacoes: ["Nenhum atributo disponível para análise."],
    };
  }

  /**
   * Método privado para uso interno da classe
   */
  private criarResultadoVazioInterno(): ResultadoAnaliseAtributos {
    return this.criarResultadoVazio();
  }
}
