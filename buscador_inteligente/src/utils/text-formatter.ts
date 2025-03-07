import {
  ContentBlock,
  TextBlock,
  CodeBlock,
  HeadingBlock,
  ListOrderedBlock,
  ListUnorderedBlock,
  TableBlock,
  QuoteBlock,
  AlertBlock,
  ListItem,
} from "../types";

/**
 * Classe para formatar texto em blocos estruturados
 */
export class TextFormatter {
  /**
   * Processa um texto bruto e o converte em blocos estruturados
   * @param text Texto bruto para processar
   * @returns Array de blocos de conteúdo estruturados
   */
  static processText(text: string): ContentBlock[] {
    if (!text || typeof text !== "string") {
      return [];
    }

    const blocks: ContentBlock[] = [];

    // Dividir o texto em blocos lógicos
    const segments = this.splitIntoSegments(text);

    for (const segment of segments) {
      const processedBlocks = this.processSegment(segment);
      blocks.push(...processedBlocks);
    }

    return blocks;
  }

  /**
   * Divide o texto em segmentos lógicos (blocos de código, parágrafos, etc.)
   * @param text Texto completo
   * @returns Array de segmentos
   */
  private static splitIntoSegments(text: string): string[] {
    const segments: string[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;

    // Extrair blocos de código
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Adicionar texto antes do bloco de código
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index).trim();
        if (textBefore) {
          segments.push(textBefore);
        }
      }

      // Adicionar o bloco de código completo
      segments.push(match[0]);

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim();
      if (remainingText) {
        segments.push(remainingText);
      }
    }

    return segments;
  }

  /**
   * Processa um segmento de texto e o converte em blocos estruturados
   * @param segment Segmento de texto
   * @returns Array de blocos de conteúdo
   */
  private static processSegment(segment: string): ContentBlock[] {
    // Verificar se é um bloco de código
    const codeBlockMatch = segment.match(/```(\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || "text";
      const content = codeBlockMatch[2].trim();

      return [
        {
          type: "code",
          language,
          content,
        } as CodeBlock,
      ];
    }

    // Dividir em parágrafos
    const paragraphs = segment.split(/\n{2,}/);
    const blocks: ContentBlock[] = [];

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      // Verificar se é um título
      const headingMatch = trimmedParagraph.match(/^(#{1,6})\s+(.+)$/m);
      if (headingMatch) {
        blocks.push({
          type: "heading",
          level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
          content: headingMatch[2].trim(),
        } as HeadingBlock);
        continue;
      }

      // Verificar se é uma lista ordenada
      if (/^\d+\.\s/.test(trimmedParagraph)) {
        const items = this.parseOrderedList(trimmedParagraph);
        blocks.push({
          type: "list-ordered",
          content: items.map((item) => item.content).join("\n"),
          items,
        } as ListOrderedBlock);
        continue;
      }

      // Verificar se é uma lista não ordenada
      if (/^[-*]\s/.test(trimmedParagraph)) {
        const items = this.parseUnorderedList(trimmedParagraph);
        blocks.push({
          type: "list-unordered",
          content: items.map((item) => item.content).join("\n"),
          items,
        } as ListUnorderedBlock);
        continue;
      }

      // Verificar se é uma citação
      if (/^>\s/.test(trimmedParagraph)) {
        const content = trimmedParagraph.replace(/^>\s/gm, "").trim();
        blocks.push({
          type: "quote",
          content,
        } as QuoteBlock);
        continue;
      }

      // Verificar se é um alerta
      const alertMatch = trimmedParagraph.match(/^(!{1,3})\s+(\w+):\s+(.+)$/s);
      if (alertMatch) {
        const level = this.parseAlertLevel(alertMatch[2].toLowerCase());
        blocks.push({
          type: "alert",
          content: alertMatch[3].trim(),
          variant: level,
        } as AlertBlock);
        continue;
      }

      // Verificar se é uma tabela
      if (
        trimmedParagraph.includes("|") &&
        /\|[-:]+\|/.test(trimmedParagraph)
      ) {
        const { headers, rows } = this.parseTable(trimmedParagraph);
        blocks.push({
          type: "table",
          headers,
          rows,
        } as TableBlock);
        continue;
      }

      // Texto normal
      blocks.push({
        type: "text",
        content: trimmedParagraph,
      } as TextBlock);
    }

    return blocks;
  }

  /**
   * Processa uma lista ordenada
   * @param text Texto da lista
   * @returns Array de itens da lista
   */
  private static parseOrderedList(text: string): ListItem[] {
    const lines = text.split("\n");
    const items: ListItem[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d+\.\s+)(.+)$/);
      if (match) {
        items.push({
          content: match[2].trim(),
        });
      }
    }

    return items;
  }

  /**
   * Processa uma lista não ordenada
   * @param text Texto da lista
   * @returns Array de itens da lista
   */
  private static parseUnorderedList(text: string): ListItem[] {
    const lines = text.split("\n");
    const items: ListItem[] = [];

    for (const line of lines) {
      const match = line.match(/^[-*]\s+(.+)$/);
      if (match) {
        items.push({
          content: match[1].trim(),
        });
      }
    }

    return items;
  }

  /**
   * Processa uma tabela
   * @param text Texto da tabela
   * @returns Objeto com cabeçalhos e linhas da tabela
   */
  private static parseTable(text: string): {
    headers: string[];
    rows: string[][];
  } {
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 3) {
      return { headers: [], rows: [] };
    }

    // Processar cabeçalhos
    const headerLine = lines[0];
    const headers = headerLine
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell !== "");

    // Ignorar linha de separação

    // Processar linhas
    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
      const row = lines[i]
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "");

      if (row.length > 0) {
        rows.push(row);
      }
    }

    return { headers, rows };
  }

  /**
   * Determina o nível de alerta com base no texto
   * @param text Texto do nível de alerta
   * @returns Nível de alerta normalizado
   */
  private static parseAlertLevel(
    text: string
  ): "info" | "warning" | "error" | "success" {
    if (
      text.includes("warn") ||
      text.includes("cuidado") ||
      text.includes("atenção")
    ) {
      return "warning";
    } else if (
      text.includes("erro") ||
      text.includes("perigo") ||
      text.includes("falha")
    ) {
      return "error";
    } else if (
      text.includes("sucesso") ||
      text.includes("ok") ||
      text.includes("pronto")
    ) {
      return "success";
    } else {
      return "info";
    }
  }
}
