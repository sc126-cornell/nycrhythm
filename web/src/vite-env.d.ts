/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** CARTO Basemaps API key. Raster tiles come back as a watermark without it. */
  readonly VITE_CARTO_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
