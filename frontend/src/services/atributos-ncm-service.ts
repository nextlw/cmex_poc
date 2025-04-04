/**
 * Serviço para consultar e analisar atributos NCM
 *
 * Este serviço gerencia a obtenção de atributos NCM e utiliza o agente especializado
 * para realizar o raciocínio sobre quais atributos são relevantes para o contexto.
 */

import axios from "axios";
import {
  AtributoNCM,
  FormaPreenchimento,
  Modalidade,
} from "../types/atributos";
import {
  AtributosNCMAgent,
  AtributosNCMAgentConfig,
  ResultadoAnaliseAtributos,
} from "../agents/AtributosNCMAgent";

// Configuração de ambientes
const API_CONFIG = {
  local: {
    baseUrl: "http://localhost:10000/api/v1",
    usarMock: true,
  },
  producao: {
    baseUrl: process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/api/v1`
      : "https://api-cmex.exemplo.com/api/v1",
    usarMock: false,
  },
};

/**
 * Classe de serviço para gerenciamento de atributos NCM
 */
export class AtributosNCMService {
  private ambiente: "local" | "producao";
  private agent: AtributosNCMAgent | null = null;
  private atributosCache: Record<string, AtributoNCM[]> = {};

  constructor(ambiente: "local" | "producao" = "local") {
    this.ambiente = ambiente;
    console.log(`AtributosNCMService inicializado em ambiente: ${ambiente}`);
  }

  /**
   * Obtém o agente de raciocínio para atributos NCM
   */
  private getAgent(
    config: Partial<AtributosNCMAgentConfig> = {}
  ): AtributosNCMAgent {
    if (!this.agent) {
      // Configuração padrão do agente
      const agentConfig: AtributosNCMAgentConfig = {
        ambiente: this.ambiente === "producao" ? "producao" : "desenvolvimento",
        dataReferencia: new Date(),
        ...config,
      };

      this.agent = new AtributosNCMAgent(agentConfig);
      console.log("Agente AtributosNCM inicializado");
    }

    return this.agent;
  }

  /**
   * Consulta atributos NCM no servidor ou usa mock se configurado
   */
  public async consultarAtributosNCM(
    ncmCode: string,
    forcarBusca: boolean = false
  ): Promise<AtributoNCM[]> {
    // Remover pontos do código NCM
    const ncmFormatado = ncmCode.replace(/\./g, "");

    // Verificar cache, se não estiver forçando busca
    if (!forcarBusca && this.atributosCache[ncmFormatado]) {
      console.log(`Usando atributos em cache para NCM ${ncmFormatado}`);
      return this.atributosCache[ncmFormatado];
    }

    // Definir a URL base conforme ambiente
    const { baseUrl, usarMock } = API_CONFIG[this.ambiente];

    try {
      let atributos: AtributoNCM[];

      // Usar mock ou API real
      if (usarMock) {
        console.log(`Usando mock para atributos de NCM ${ncmFormatado}`);
        atributos = await this.getMockAtributos(ncmFormatado);
      } else {
        // Fazer a requisição à API
        console.log(`Consultando atributos para NCM ${ncmFormatado} via API`);
        const response = await axios.get(
          `${baseUrl}/ncm/${ncmFormatado}/attributes`
        );
        atributos = response.data;
      }

      // Guardar no cache
      this.atributosCache[ncmFormatado] = atributos;

      return atributos;
    } catch (error) {
      console.error(
        `Erro ao consultar atributos para NCM ${ncmFormatado}:`,
        error
      );
      return [];
    }
  }

  /**
   * Analisa atributos NCM usando o agente especializado
   */
  public async analisarAtributosNCM(
    ncmCode: string,
    contexto?: Record<string, any>,
    configAgente?: Partial<AtributosNCMAgentConfig>
  ): Promise<ResultadoAnaliseAtributos> {
    try {
      // Obter os atributos
      const atributos = await this.consultarAtributosNCM(ncmCode);

      if (!atributos || atributos.length === 0) {
        console.warn(`Nenhum atributo encontrado para NCM ${ncmCode}`);
        return this.getAgent(configAgente).criarResultadoVazio();
      }

      // Configurar o agente com as opções fornecidas
      const agent = this.getAgent({
        ...configAgente,
        ambiente: this.ambiente === "producao" ? "producao" : "desenvolvimento",
      });

      // Analisar os atributos
      return agent.analisarAtributos(atributos, contexto);
    } catch (error) {
      console.error(`Erro ao analisar atributos para NCM ${ncmCode}:`, error);
      return this.getAgent(configAgente).criarResultadoVazio();
    }
  }

  /**
   * Gera atributos mock para desenvolvimento
   */
  private async getMockAtributos(ncmCode: string): Promise<AtributoNCM[]> {
    // Simular um delay de rede
    await new Promise((resolve) => setTimeout(resolve, 300));

    // MOCK: Lista de atributos para desenvolvimento
    // Esta lista deve ser personalizada para o tipo de produto
    const atributos: AtributoNCM[] = [
      {
        codigo: "ATR001",
        nome: "Descrição do Produto",
        nomeApresentacao: "Descrição Detalhada",
        formaPreenchimento: FormaPreenchimento.TEXTO,
        modalidade: Modalidade.AMBOS,
        obrigatorio: true,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" }],
        orgaos: ["RECEITA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
      {
        codigo: "ATR002",
        nome: "Marca Comercial",
        nomeApresentacao: "Marca",
        formaPreenchimento: FormaPreenchimento.TEXTO,
        modalidade: Modalidade.AMBOS,
        obrigatorio: true,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" }],
        orgaos: ["RECEITA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
      {
        codigo: "ATR003",
        nome: "Registro ANVISA",
        nomeApresentacao: "Nº Registro ANVISA",
        formaPreenchimento: FormaPreenchimento.TEXTO,
        modalidade: Modalidade.IMPORTACAO,
        obrigatorio: true,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "2", descricao: "LICENCIAMENTO" }],
        orgaos: ["ANVISA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
      {
        codigo: "ATR004",
        nome: "País de Origem",
        nomeApresentacao: "País Origem",
        formaPreenchimento: FormaPreenchimento.LISTA_ESTATICA,
        modalidade: Modalidade.IMPORTACAO,
        obrigatorio: true,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" }],
        orgaos: ["RECEITA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
      {
        codigo: "ATR005",
        nome: "Composição Química",
        nomeApresentacao: "Composição",
        formaPreenchimento: FormaPreenchimento.TEXTO,
        modalidade: Modalidade.IMPORTACAO,
        obrigatorio: true,
        dataInicioVigencia: "2020-01-01",
        objetivos: [
          { codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" },
          { codigo: "3", descricao: "FISCALIZACAO_QUIMICA" },
        ],
        orgaos: ["ANVISA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
      {
        codigo: "ATR006",
        nome: "Finalidade de Uso",
        nomeApresentacao: "Finalidade",
        formaPreenchimento: FormaPreenchimento.TEXTO,
        modalidade: Modalidade.AMBOS,
        obrigatorio: false,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" }],
        orgaos: ["RECEITA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
      {
        codigo: "ATR007",
        nome: "Forma de Apresentação",
        nomeApresentacao: "Apresentação",
        formaPreenchimento: FormaPreenchimento.LISTA_ESTATICA,
        modalidade: Modalidade.AMBOS,
        obrigatorio: false,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" }],
        orgaos: ["RECEITA", "ANVISA"],
        atributoCondicionante: false,
        multivalorado: false,
      },
    ];

    // Para perfumaria (33.07), adicionar atributos específicos
    if (ncmCode.startsWith("3307")) {
      atributos.push({
        codigo: "ATR008",
        nome: "Tipo de Fragrância",
        nomeApresentacao: "Fragrância",
        formaPreenchimento: FormaPreenchimento.LISTA_ESTATICA,
        modalidade: Modalidade.AMBOS,
        obrigatorio: true,
        dataInicioVigencia: "2020-01-01",
        objetivos: [{ codigo: "1", descricao: "IDENTIFICACAO_PRODUTO" }],
        orgaos: ["ANVISA"],
        atributoCondicionante: false,
        multivalorado: false,
      });
    }

    return atributos;
  }
}
