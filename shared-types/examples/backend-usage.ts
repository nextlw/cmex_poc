/**
 * Exemplo de uso do pacote @cmex/shared-types no backend
 * 
 * Nota: Este é um arquivo de exemplo e não deve ser executado diretamente.
 * Ele serve apenas como ilustração de como usar o pacote no código real.
 */

// ANTES: Definições de tipos no próprio backend
// type QueryStatus = 'processing' | 'in_progress' | 'completed' | 'error';
// 
// interface Query {
//   id: string | number;
//   title: string;
//   timestamp: string;
//   status: QueryStatus;
//   question: string;
//   summary?: string;
// }

// DEPOIS: Importação dos tipos do pacote compartilhado
// Nota: No código real, você instalaria o pacote via npm
// import { Query, TokenTracker, Stream } from '@cmex/shared-types';

// Simulando as importações para fins de exemplo
const QueryModule = {
  BackendQueryStatus: {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error'
  },
  backendQuerySchema: {
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data })
  }
};

const TokenTrackerModule = {
  backendTokenTrackerSchema: {
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data })
  }
};

const StreamModule = {
  backendStreamMessageTypeSchema: {
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true })
  }
};

// Funções simuladas
const generateUniqueId = () => {
  return Date.now().toString();
};

// Simulação de banco de dados
const database = {
  queries: {
    create: async (data: any) => {
      console.log('Criando consulta no banco:', data);
      return data;
    }
  }
};

// Exemplo de rota para criar uma nova consulta
// Nota: Simulando um roteador Express
interface ExpressRequest {
  body: {
    title?: string;
    question?: string;
    [key: string]: any;
  };
}

interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (data: any) => void;
}

const expressRouter = {
  post: (path: string, handler: (req: ExpressRequest, res: ExpressResponse) => Promise<void>) => {
    console.log(`Rota ${path} registrada`);
  }
};

// Exemplo de rota para criar consulta
expressRouter.post('/api/v1/query', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { title, question } = req.body;
    
    // ANTES: Validação ad-hoc
    // if (!title || !question) {
    //   return res.status(400).json({ error: 'Título e pergunta são obrigatórios' });
    // }
    
    // DEPOIS: Validação com Zod
    try {
      // Validar usando o schema Zod
      const queryData = QueryModule.backendQuerySchema.parse({
        id: generateUniqueId(),
        title,
        timestamp: new Date().toISOString(),
        status: 'processing',
        question
      });
      
      // Salvar na base de dados
      const savedQuery = await database.queries.create(queryData);
      
      return res.status(201).json({ query: savedQuery });
    } catch (error: any) {
      // Erros detalhados de validação
      if (error.errors) {
        return res.status(400).json({ 
          error: 'Dados de consulta inválidos', 
          details: error.errors 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Exemplo de uso do TokenTracker
class QueryProcessor {
  tokenTracker: {
    usages: Array<{ tool: string, tokens: number }>;
    budget: number;
    getTotalUsage: () => number;
  };
  
  constructor() {
    this.tokenTracker = {
      usages: [],
      budget: 1000,
      getTotalUsage: function() {
        return this.usages.reduce((sum, item) => sum + item.tokens, 0);
      }
    };
  }
  
  async processQuery(query: any) {
    // Executar operações...
    
    // Adicionar uso de tokens
    this.tokenTracker.usages.push({
      tool: 'llm',
      tokens: 150
    });
    
    // Resto do processamento...
    
    // Exemplo de validação do tracker
    try {
      TokenTrackerModule.backendTokenTrackerSchema.parse(this.tokenTracker);
      console.log('Rastreador de tokens válido');
    } catch (error: any) {
      console.error('Rastreador de tokens inválido:', error.errors);
    }
    
    // Retornar o resultado
    return {
      result: 'Resposta processada',
      trackers: {
        tokenTracker: this.tokenTracker
      }
    };
  }
}

// Exemplo de streaming de mensagens
// Nota: Simulando WebSocket
interface ClientSocket {
  send: (data: string) => void;
}

interface SocketServer {
  on: (event: string, handler: (ws: ClientSocket) => void) => void;
}

// Simulação do WebSocket
const createSocketServer = (options: { port: number }): SocketServer => {
  return {
    on: (event, handler) => {
      console.log(`WebSocketServer registrou handler para ${event}`);
    }
  };
};

const wsServer = createSocketServer({ port: 8080 });

wsServer.on('connection', (ws: ClientSocket) => {
  // Enviar uma mensagem de conexão
  sendStreamMessage(ws, {
    type: 'connected',
    data: 'Conexão estabelecida'
  });
  
  // Iniciar processamento
  processQueryWithStreaming(ws, 'Como funciona o streaming?');
});

function sendStreamMessage(ws: ClientSocket, message: { type: string, data: any, trackers?: any }) {
  try {
    // Validar a mensagem antes de enviar
    const isValid = StreamModule.backendStreamMessageTypeSchema.safeParse(message.type).success;
    
    if (!isValid) {
      console.warn(`Tipo de mensagem inválido: ${message.type}`);
    }
    
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}

async function processQueryWithStreaming(ws: ClientSocket, question: string) {
  // Enviar mensagem de início de processamento
  sendStreamMessage(ws, {
    type: 'progress',
    data: 'Iniciando processamento'
  });
  
  // Enviar mensagem de busca
  sendStreamMessage(ws, {
    type: 'search',
    data: {
      query: 'streaming websocket'
    }
  });
  
  // Simulação de processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Enviar resposta final
  sendStreamMessage(ws, {
    type: 'answer',
    data: {
      answer: 'O streaming funciona enviando mensagens incrementais via WebSocket.'
    },
    trackers: {
      tokenTracker: {
        usages: [
          { tool: 'search', tokens: 10 },
          { tool: 'llm', tokens: 50 }
        ],
        getTotalUsage: function() { return 60; }
      }
    }
  });
} 