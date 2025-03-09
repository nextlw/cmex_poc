import { expect, describe, it } from "vitest";
import {
  transformServerLog,
  transformLogsResponse,
  ServerLog,
  LogLevel,
  PromptContent,
} from "../src/logs";

describe("Logs Transformers", () => {
  describe("transformServerLog", () => {
    it("deve transformar um log de servidor corretamente", () => {
      const serverLog: ServerLog = {
        timestamp: "2023-06-15T14:30:00Z",
        message: "Operação concluída com sucesso",
        level: "info" as LogLevel,
        context: {
          pid: 1234,
          env: "production",
          requestId: "req-123",
        },
      };

      const result = transformServerLog(serverLog);

      expect(result).toEqual({
        timestamp: "2023-06-15T14:30:00Z",
        message: "Operação concluída com sucesso",
        level: "info",
      });
    });

    it("deve lidar com logs de servidor inválidos", () => {
      const invalidLog = {
        // timestamp está faltando
        message: "",
        level: "unknown-level",
        context: {},
      };

      // @ts-ignore - testando com objeto inválido propositalmente
      const result = transformServerLog(invalidLog);

      // Verificar se retornou valores razoáveis mesmo com entrada inválida
      expect(result.message).toBeTruthy(); // algum fallback para mensagem
      expect(["debug", "info", "warn", "error"]).toContain(result.level); // level deve ser um valor válido
      expect(typeof result.timestamp).toBe("string"); // algum timestamp foi gerado
    });
  });

  describe("transformLogsResponse", () => {
    it("deve transformar uma resposta de logs corretamente", () => {
      const serverLogs: ServerLog[] = [
        {
          timestamp: "2023-06-15T14:30:00Z",
          message: "Operação iniciada",
          level: "info" as LogLevel,
          context: { pid: 1234 },
        },
        {
          timestamp: "2023-06-15T14:31:00Z",
          message: "Erro na operação",
          level: "error" as LogLevel,
          context: { pid: 1234 },
        },
      ];

      const promptContents: PromptContent[] = [
        {
          filename: "prompt1.txt",
          content: "Conteúdo do primeiro prompt",
        },
      ];

      const result = transformLogsResponse(serverLogs, promptContents);

      expect(result.logs).toBeDefined();
      expect(result.logs!.length).toBe(2);
      expect(result.logs![0].message).toBe("Operação iniciada");
      expect(result.logs![1].level).toBe("error");

      expect(result.promptContents).toBeDefined();
      expect(result.promptContents!.length).toBe(1);
      expect(result.promptContents![0].filename).toBe("prompt1.txt");
    });

    it("deve lidar com listas vazias", () => {
      const result = transformLogsResponse([], []);

      expect(result.logs).toEqual([]);
      expect(result.promptContents).toEqual([]);
    });

    it("deve lidar com logs inválidos na lista", () => {
      const mixedLogs = [
        {
          timestamp: "2023-06-15T14:30:00Z",
          message: "Log válido",
          level: "info" as LogLevel,
          context: { pid: 1234 },
        },
        {
          // log inválido propositalmente
          level: "unknown",
          context: {},
        },
      ];

      // @ts-ignore - testando com objetos inválidos propositalmente
      const result = transformLogsResponse(mixedLogs);

      // Deve conter os dois logs, mesmo que um seja inválido (transformado com fallbacks)
      expect(result.logs).toHaveLength(2);
      expect(result.logs![0].level).toBe("info");
      expect(result.logs![1]).toBeTruthy(); // segundo log deve existir com valores fallback
    });

    it("deve lidar com promptContents inválidos", () => {
      const serverLogs: ServerLog[] = [
        {
          timestamp: "2023-06-15T14:30:00Z",
          message: "Log válido",
          level: "info" as LogLevel,
          context: { pid: 1234 },
        },
      ];

      const invalidPromptContents = [
        {
          // filename está faltando
          content: "Conteúdo do prompt",
        },
        {
          filename: "prompt2.txt",
          // content está faltando
        },
      ];

      // @ts-ignore - testando com objetos inválidos propositalmente
      const result = transformLogsResponse(serverLogs, invalidPromptContents);

      // Os logs válidos devem estar presentes
      expect(result.logs).toHaveLength(1);
      // promptContents inválidos podem ter sido filtrados ou corrigidos
      if (result.promptContents) {
        result.promptContents.forEach((prompt) => {
          expect(prompt.filename).toBeTruthy();
          expect(prompt.content).toBeTruthy();
        });
      }
    });
  });
});
