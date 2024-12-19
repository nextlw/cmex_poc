/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string;
  readonly VITE_APP_SUPABASE_URL: string;
  readonly VITE_APP_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
