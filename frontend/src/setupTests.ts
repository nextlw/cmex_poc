import '@testing-library/jest-dom';

// Mock do import.meta.env
// @ts-ignore - Ignorando erros de tipagem para o teste
global.import = {
  meta: {
    env: {
      VITE_API_LOCAL_URL: 'http://localhost:3000',
      VITE_APP_SUPABASE_URL: 'https://diyaxufhlpcxbevpbjsh.supabase.co',
      VITE_APP_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeWF4dWZobHBjeGJldnBianNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTAzNTcsImV4cCI6MjA0OTk2NjM1N30.6VON8eagfGOVQFcgQ4PkDGjlR6RmR36XfgGJcFO8Lnc',
      VITE_API_BASE_URL: 'http://localhost:8000/api',
      VITE_APP_NODE_ENV: 'dev'
      // Adicione outras variáveis de ambiente do Vite que você usa
    }
  }
};

// Mock do EventSource
class MockEventSource {
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  close = jest.fn();
}

// @ts-ignore - Ignorando erros de tipagem para o teste
global.EventSource = MockEventSource; 