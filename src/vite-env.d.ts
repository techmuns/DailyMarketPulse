/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUDIO_MODE?: 'browser' | 'premium';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
