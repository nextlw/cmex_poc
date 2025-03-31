/**
 * Utilitários para formatação de datas
 */

/**
 * Tipos de formatação de data suportados
 */
type DateFormatType = "full" | "short" | "year" | "month" | "relative";

/**
 * Formata uma data com base no tipo especificado
 *
 * @param date Data a ser formatada
 * @param type Tipo de formatação desejado
 * @returns String formatada da data
 */
export function formatDateBasedOnType(
  date: Date,
  type: DateFormatType = "full"
): string {
  const now = new Date();

  switch (type) {
    case "full":
      return date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    case "short":
      return date.toLocaleDateString("pt-BR");

    case "year":
      return date.getFullYear().toString();

    case "month":
      return date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });

    case "relative":
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "hoje";
      if (diffDays === 1) return "ontem";
      if (diffDays < 7) return `${diffDays} dias atrás`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
      return `${Math.floor(diffDays / 365)} anos atrás`;

    default:
      return date.toISOString();
  }
}
