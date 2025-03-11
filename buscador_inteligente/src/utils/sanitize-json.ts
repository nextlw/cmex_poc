/**
 * Função para remover funções de um objeto antes de serializá-lo para JSON.
 * Isso evita erros de serialização quando há funções no objeto.
 *
 * @param obj Objeto a ser sanitizado
 * @returns Objeto sem funções, pronto para ser serializado
 */
export function sanitizeForJSON(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "function") {
    return "[Function]";
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForJSON(item));
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = sanitizeForJSON(obj[key]);
    }
  }
  return newObj;
}
