/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Добавьте другие env переменные по необходимости
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}