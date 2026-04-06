/// <reference types="astro/client" />
/// <reference types="@astrojs/tailwind/types" />

interface ImportMetaEnv {
  readonly API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
