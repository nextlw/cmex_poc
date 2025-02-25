  /**
   * Tenta extrair o conte do entre as tags <think> e </think> de um texto.
   * Caso n o encontre, retorna o texto original.
   * @param content Texto que pode conter tags <think>
   * @returns O conte do entre as tags <think> se presente, sen o o texto original.
   */
export function extractThinkContent(content: string): string {
  // Define o regex para extrair o conteúdo entre as tags <think> e </think>
  const regex = /<think>([\s\S]*?)<\/think>/i;
  // Encontra o primeiro match
  const match = content.match(regex);
  // Se o match for encontrado e o conteúdo for válido, retorna o conteúdo
  if (match && match[1]) {
    // Retorna o conteúdo entre as tags <think> e </think>
    return match[1].trim();
  }
  // Retorna o texto original
  return content.trim();
  } 