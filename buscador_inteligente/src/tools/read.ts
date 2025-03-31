import { ReadResponse } from "../types/globalTypes";
import { TokenTracker } from "../utils/token-tracker";
import https from "https";
import { URL } from "url";

/**
 * Lê o conteúdo de uma URL.
 *
 * @param url URL para ler o conteúdo
 * @param includeLinks Indica se deve incluir links encontrados na página
 * @param tokenTracker Rastreador de tokens opcional para contabilizar uso
 * @returns Promise com objeto contendo os dados lidos e tokens utilizados
 */
export async function readUrl(
  url: string,
  includeLinks: boolean = false,
  tokenTracker?: TokenTracker
): Promise<{ response: ReadResponse; tokens: number }> {
  try {
    // Validar a URL
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Protocolo inválido: apenas http e https são suportados");
    }

    // Simular resposta bem-sucedida com informações da URL
    const response: ReadResponse = {
      code: 200,
      status: 200,
      data: {
        title: `Conteúdo de ${parsedUrl.hostname}`,
        description: `Descrição da página em ${url}`,
        url: url,
        content: `Conteúdo extraído de ${url}. Este é um conteúdo simulado para demonstração.`,
        usage: { tokens: 100 },
      },
    };

    // Se solicitado, incluir links fictícios
    if (includeLinks && response.data) {
      response.data.links = [
        ["Link relacionado 1", "https://exemplo.com/relacionado1"],
        ["Link relacionado 2", "https://exemplo.com/relacionado2"],
      ];
    }

    // Contabilizar tokens se um rastreador for fornecido
    if (tokenTracker) {
      tokenTracker.trackTokens({
        tool: "read",
        tokens: response.data?.usage?.tokens || 100,
      });
    }

    return {
      response,
      tokens: response.data?.usage?.tokens || 100,
    };
  } catch (error) {
    // Em caso de erro, retornar resposta de erro
    console.error(`Erro ao ler URL ${url}:`, error);
    const errorResponse: ReadResponse = {
      code: 500,
      status: 500,
      message: `Erro ao ler URL: ${(error as Error).message}`,
      readableMessage: `Não foi possível ler o conteúdo de ${url}. Por favor, verifique se a URL está correta e acessível.`,
    };

    return {
      response: errorResponse,
      tokens: 0,
    };
  }
}

export function removeAllLineBreaks(text: string) {
  return text.replace(/(\r\n|\n|\r)/gm, " ");
}
