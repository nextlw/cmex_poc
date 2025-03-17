import https from "https";
import { TokenTracker } from "../utils/token-tracker";
import { ReadResponse } from "../types/globalTypes";
import { JINA_API_KEY } from "../config";

/**
 * Lê uma URL e retorna o conteúdo da resposta.
 * @param url URL a ser lida.
 * @param tracker Rastreador de tokens.
 * @returns O conteúdo da resposta e o número de tokens usados.
 */
export function readUrl(
  url: string,
  tracker?: TokenTracker
): Promise<{ response: ReadResponse; tokens: number }> {
  // Retorna uma promise
  return new Promise((resolve, reject) => {
    // Cria o corpo da requisição
    const data = JSON.stringify({ url });

    // Cria as opções da requisição
    const options = {
      // Define o hostname
      hostname: "r.jina.ai",
      // Define a porta
      port: 443,
      // Define o path
      path: "/",
      // Define o método
      method: "POST",
      // Define os headers
      headers: {
        // Define o Accept
        Accept: "application/json",
        // Define o Authorization
        Authorization: `Bearer ${JINA_API_KEY}`,
        // Define o Content-Type
        "Content-Type": "application/json",
        // Define o Content-Length
        "Content-Length": data.length,
        // Define o X-Retain-Images
        "X-Retain-Images": "none",
        // Define o X-Return-Format
        "X-Return-Format": "markdown",
      },
    };

    // Cria a requisição
    const req = https.request(options, (res) => {
      // Inicializa a resposta
      let responseData = "";
      // Adiciona o evento de data
      res.on("data", (chunk) => (responseData += chunk));
      // Adiciona o evento de fim
      res.on("end", () => {
        // Converte a resposta para JSON
        const response = JSON.parse(responseData) as ReadResponse;
        // Loga a resposta original
        // console.log('Raw read response:', response);

        // Se o código da resposta for 402, rejeita a promise
        if (response.code === 402) {
          // Rejeita a promise
          reject(new Error(response.readableMessage || "Insufficient balance"));
          // Retorna
          return;
        }

        // Se a resposta não contém dados, rejeita a promise
        if (!response.data) {
          // Rejeita a promise
          reject(new Error("Invalid response data"));
          // Retorna
          return;
        }

        // Loga a resposta
        console.log("Read:", {
          // Título
          title: response.data.title,
          // URL
          url: response.data.url,
          // Tokens
          tokens: response.data.usage?.tokens || 0,
        });

        // Obtém o número de tokens
        const tokens = response.data.usage?.tokens || 0;
        // Rastrea o uso de tokens
        (tracker || new TokenTracker()).trackUsage("read", tokens);
        // Resolve a promise
        resolve({ response, tokens });
      });
    });

    // Adiciona o evento de erro
    req.on("error", reject);
    // Escreve o corpo da requisição
    req.write(data);
    // Finaliza a requisição
    req.end();
  });
}
export function removeAllLineBreaks(text: string) {
  return text.replace(/(\r\n|\n|\r)/gm, " ");
}
