import {
  transformServerLog,
  transformLogsResponse,
  ServerLog,
  LogsResponse
} from '../logsTransformers';

describe('Logs Transformers', () => {
  describe('transformServerLog', () => {
    it('deve transformar um log válido corretamente', () => {
      const backendLog: ServerLog = {
        context: { 
          pid: 1234,
          env: 'development',
          requestId: 'req-123'
        },
        timestamp: '2023-02-25T12:00:00Z',
        message: 'Teste de log',
        level: 'info'
      };

      const result = transformServerLog(backendLog);
      
      expect(result).toEqual({
        timestamp: '2023-02-25T12:00:00Z',
        message: 'Teste de log',
        level: 'info'
      });
      
      // O campo context não deve estar presente
      expect(result).not.toHaveProperty('context');
    });

    it('deve lidar com logs inválidos graciosamente', () => {
      const invalidLog = {
        timestamp: '2023-02-25T12:00:00Z',
        message: 'Log com campo obrigatório ausente'
        // level é obrigatório mas está ausente
      };

      const result = transformServerLog(invalidLog);
      
      expect(result.timestamp).toBeDefined();
      expect(result.message).toBe(invalidLog.message);
      expect(result.level).toBe('error'); // Fallback para erro
    });
  });

  describe('transformLogsResponse', () => {
    it('deve transformar uma lista de logs corretamente', () => {
      const backendLogs: ServerLog[] = [
        {
          context: { 
            pid: 1234,
            env: 'development',
            requestId: 'req-123'
          },
          timestamp: '2023-02-25T12:00:00Z',
          message: 'Log 1',
          level: 'info'
        },
        {
          context: { 
            pid: 1234,
            env: 'development',
            requestId: 'req-123'
          },
          timestamp: '2023-02-25T12:01:00Z',
          message: 'Log 2',
          level: 'warn'
        }
      ];

      const result = transformLogsResponse(backendLogs);
      
      expect(result.serverLogs).toHaveLength(2);
      expect(result.serverLogs[0].message).toBe('Log 1');
      expect(result.serverLogs[1].message).toBe('Log 2');
      
      // Nenhum dos logs deve ter o campo context
      expect(result.serverLogs[0]).not.toHaveProperty('context');
      expect(result.serverLogs[1]).not.toHaveProperty('context');
    });

    it('deve incluir promptContents quando fornecido', () => {
      const backendLogs: ServerLog[] = [
        {
          context: { 
            pid: 1234,
            env: 'development'
          },
          timestamp: '2023-02-25T12:00:00Z',
          message: 'Log 1',
          level: 'info'
        }
      ];

      const promptContents = [
        {
          filename: 'prompt1.txt',
          content: 'Conteúdo do prompt 1'
        }
      ];

      const result: LogsResponse = transformLogsResponse(backendLogs, promptContents);
      
      expect(result.serverLogs).toHaveLength(1);
      expect(result.promptContents).toHaveLength(1);
      expect(result.promptContents?.[0].filename).toBe('prompt1.txt');
    });

    it('deve retornar um objeto vazio mas válido para entrada inválida', () => {
      // @ts-ignore
      const result = transformLogsResponse(null);
      
      expect(result).toEqual({ serverLogs: [] });
    });
  });
}); 