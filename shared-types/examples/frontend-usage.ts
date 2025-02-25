/**
 * Exemplo de uso do pacote @cmex/shared-types no frontend
 * 
 * Nota: Este é um arquivo de exemplo e não deve ser executado diretamente.
 * Ele serve apenas como ilustração de como usar o pacote no código real.
 */

// ANTES: Importação direta dos transformadores do projeto
// import { transformQueryList } from "../../utils/transformers/queryTransformers";
// import { transformLogsResponse } from "../../utils/transformers/logsTransformers";

// DEPOIS: Importação do pacote compartilhado
// Nota: No código real, você instalaria o pacote via npm
// import { Query, Logs } from '@cmex/shared-types';

// Simulando as importações para fins de exemplo
const Query = {
  transformQueryList: (queries: any[]) => queries.map(q => ({
    ...q,
    status: q.status === 'processing' ? 'in_progress' : q.status
  })),
  backendQuerySchema: {
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data })
  }
};

const Logs = {
  transformLogsResponse: (logs: any[], promptContents?: any[]) => ({
    logs: logs || [],
    promptContents: promptContents || []
  })
};

// Exemplo de uso em um componente React
// Simulação de ambiente React
const useState = <T,>(initialState: T): [T, (newState: T) => void] => {
  let state = initialState;
  const setState = (newState: T) => { state = newState; };
  return [state, setState];
};

const useEffect = (fn: () => void | (() => void), deps?: any[]) => {
  fn();
};

// Função simulada
const setAnswer = (answer: string) => {
  console.log('Resposta definida:', answer);
};

// Função simulada
const updateTokenUsage = (tokenTracker: any) => {
  console.log('Token usage atualizado:', tokenTracker);
};

// Função simulada
const submitQuery = (query: any) => {
  console.log('Consulta enviada:', query);
};

// Função simulada
const setValidationErrors = (errors: any) => {
  console.log('Erros de validação:', errors);
};

// Componente de exemplo
export const QueryHistory = ({ onSelectQuery }: { onSelectQuery: (query: any) => void }) => {
  const [queries, setQueries] = useState<any[]>([]);
  const [data, setData] = useState<{ logs: any[] }>({ logs: [] });

  const fetchQueries = async () => {
    try {
      const API_URL = "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/v1/queries`);

      if (!response.ok) {
        throw new Error("Falha ao carregar histórico");
      }

      const data = await response.json();
      const queriesArray = data.queries || [];

      // ANTES: 
      // const formattedQueries = transformQueryList(queriesArray);

      // DEPOIS: Uso do transformador do pacote compartilhado
      const formattedQueries = Query.transformQueryList(queriesArray);
      setQueries(formattedQueries);
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  useEffect(() => {
    fetch("/api/v1/logs")
      .then((res) => res.json())
      .then((logsData) => {
        // ANTES:
        // const transformedLogs = transformLogsResponse(logsData.serverLogs || []);

        // DEPOIS: Uso do transformador do pacote compartilhado
        const transformedLogs = Logs.transformLogsResponse(logsData.serverLogs || []);
        setData(transformedLogs);
      })
      .catch(console.error);
  }, []);

  // Nota: Em um componente React real, retornaríamos elementos JSX
  // Aqui, para evitar erros de lint, retornamos uma string que representa o componente
  return {
    render: () => "Lista de consultas seria renderizada aqui"
  };
};

/**
 * Exemplo de uso diretamente via tipos e funções específicas
 */
// Simulando as importações para fins de exemplo
const transformStreamMessage = (message: any) => ({
  type: message?.type || 'progress',
  data: message?.data || {},
  trackers: message?.trackers || null
});

const transformTokenTracker = (tracker: any) => ({
  usage: tracker?.usages || [],
  totalTokens: 0
});

// Processando uma mensagem de streaming
const handleStreamMessage = (message: any) => {
  // Transformar a mensagem para o formato esperado pelo frontend
  const transformedMessage = transformStreamMessage(message);
  
  // Usar a mensagem transformada
  if (transformedMessage?.type === 'answer') {
    setAnswer(transformedMessage.data.answer);
  }
  
  // Processar o rastreador de tokens (se disponível)
  if (transformedMessage?.trackers?.tokenTracker) {
    updateTokenUsage(transformedMessage.trackers.tokenTracker);
  }
};

/**
 * Exemplo de uso com validação de schemas
 */
// Simulando as importações para fins de exemplo
const QueryValidation = {
  backendQuerySchema: {
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data })
  }
};

// Validar uma entrada de usuário para criar uma nova consulta
const validateUserQuery = (userInput: { title: string, question: string }) => {
  try {
    // Validar usando o schema Zod
    const validatedQuery = QueryValidation.backendQuerySchema.parse({
      id: "123", // Simulando UUID
      title: userInput.title,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      question: userInput.question
    });
    
    // Consulta válida, prosseguir com a operação
    submitQuery(validatedQuery);
  } catch (error: any) {
    // Exibir erros de validação para o usuário
    if (error.errors) {
      setValidationErrors(error.errors);
    }
  }
}; 