/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NODE_ENV: string;
  // Adicione aqui outras variáveis de ambiente definidas no seu projeto
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
