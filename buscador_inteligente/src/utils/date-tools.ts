import { SERPQuery } from "../types";

export function formatDateRange(query: SERPQuery) {
  let searchDateTime;
  const currentDate = new Date();
  let format = "full"; // Default format

  switch (query.tbs) {
    case "qdr:h":
      searchDateTime = new Date(Date.now() - 60 * 60 * 1000);
      format = "hour";
      break;
    case "qdr:d":
      searchDateTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      format = "day";
      break;
    case "qdr:w":
      searchDateTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      format = "day";
      break;
    case "qdr:m":
      searchDateTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      format = "day";
      break;
    case "qdr:y":
      searchDateTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      format = "year";
      break;
    default:
      searchDateTime = undefined;
  }

  if (searchDateTime !== undefined) {
    const startDate = formatDateBasedOnType(
      searchDateTime,
      format as DateFormatType
    );
    const endDate = formatDateBasedOnType(
      currentDate,
      format as DateFormatType
    );
    return `Between ${startDate} and ${endDate}`;
  }

  return "";
}

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
