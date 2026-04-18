interface ImportMetaEnv {
  VITE_API_URL: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_SITE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}